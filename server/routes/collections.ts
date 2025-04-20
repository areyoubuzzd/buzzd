import { Router } from 'express';
import { db } from '../db';
import { collections, insertCollectionSchema } from '../../shared/schema';
import { normalizeString } from '../utils/stringUtils';
import { eq } from 'drizzle-orm';
import { ZodError } from 'zod';

const router = Router();

// Get all collections
router.get('/', async (_req, res) => {
  try {
    // CRITICAL FIX: Get all collections from DB 
    // Force a manual sort to guarantee the correct order
    // This ensures Happy Hours Nearby is always first
    const allCollections = await db.select().from(collections);
    
    // CLIENT SPECIFIED SORT ORDER - DO NOT MODIFY
    // This exact prioritization scheme was specified by the client
    const manualSortOrder: Record<string, number> = {
      // TOP PRIORITY - Always first
      'active_happy_hours': 1,
      
      // PRICE-BASED COLLECTIONS (10-13)
      'beers_under_12': 10,
      'wines_under_12': 10,
      'cocktails_under_12': 10,
      'craft_beers': 12,
      'beer_buckets_under_40': 13,
      
      // SPECIAL DEAL TYPES (15-19)
      '1for1_deals': 15,
      'one_for_one_deals': 15,
      'freeflow_deals': 16,
      'free_flow_deals': 16,
      
      // PREMIUM ALCOHOL (20-22)
      'cocktails_under_15': 20,
      'wines_under_15': 21,
      'bottles_under_100': 22,
      
      // BEER BUCKETS (22-25)
      'beer_buckets': 22,
      
      // ADDITIONAL BEER COLLECTIONS (25-30)
      'beers_under_15': 25,
      
      // SPIRITS (40-41)
      'whisky_deals': 40,
      'gin_deals': 41,
      
      // All Deals comes last
      'all_deals': 60,
      
      // Any location-based collections
      'cbd_deals': 61,
      'orchard_deals': 62,
      'holland_village_deals': 63
    };
    
    // CRITICAL: Use database priorities first, then fall back to manual sort order
    // This ensures that priorities set via post-data-refresh.ts are respected
    const sortedCollections = [...allCollections].sort((a, b) => {
      // Make sure "active_happy_hours" always comes first
      if (a.slug === 'active_happy_hours') return -999; // Always first
      if (b.slug === 'active_happy_hours') return 999;  // Always first
      
      // IMPORTANT: Use the database priorities first, then fall back to our manual ordering
      const aOrder = a.priority ?? (a.slug ? manualSortOrder[a.slug] ?? 999 : 999);
      const bOrder = b.priority ?? (b.slug ? manualSortOrder[b.slug] ?? 999 : 999);
      return aOrder - bOrder;
    });
    
    // Check if Happy Hours is first
    if (sortedCollections.length > 0) {
      const first = sortedCollections[0];
      if (first.slug !== 'active_happy_hours') {
        console.error('WARNING: Happy Hours Nearby is not the first collection!');
      }
    }
    
    console.log('Returning collections sorted by priority:', 
      sortedCollections.map(c => `${c.name} (priority: ${c.priority})`));
    
    // Clear the cache for this response to ensure fresh data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Expires', '-1');
    res.setHeader('Pragma', 'no-cache');
    
    return res.json(sortedCollections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get a specific collection by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const collection = await db.select()
      .from(collections)
      .where(eq(collections.slug, slug));
      
    if (collection.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    return res.json(collection[0]);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// Create a new collection (Admin only)
router.post('/', async (req, res) => {
  try {
    // In production, add auth check for admin role
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }
    
    const data = insertCollectionSchema.parse(req.body);
    
    // Normalize the slug if it doesn't come pre-normalized
    if (!data.slug) {
      data.slug = normalizeString(data.name);
    }
    
    // Check if collection with this slug already exists
    const existing = await db.select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, data.slug));
      
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Collection with this slug already exists' });
    }
    
    const result = await db.insert(collections).values(data).returning();
    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating collection:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Update a collection (Admin only)
router.put('/:id', async (req, res) => {
  try {
    // In production, add auth check for admin role
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }
    
    const { id } = req.params;
    const data = insertCollectionSchema.parse(req.body);
    
    const result = await db
      .update(collections)
      .set(data)
      .where(eq(collections.id, parseInt(id)))
      .returning();
      
    if (result.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    return res.json(result[0]);
  } catch (error) {
    console.error('Error updating collection:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete a collection (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    // In production, add auth check for admin role
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }
    
    const { id } = req.params;
    
    const result = await db
      .delete(collections)
      .where(eq(collections.id, parseInt(id)))
      .returning();
      
    if (result.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    return res.json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return res.status(500).json({ error: 'Failed to delete collection' });
  }
});

export default router;