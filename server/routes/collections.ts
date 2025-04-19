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
    
    // Define a special sort function that ensures correct ordering
    const manualSortOrder: Record<string, number> = {
      'active_happy_hours': 1,    // Always first
      'all_deals': 2,             // Always second
      'beers_under_12': 10,
      'beers_under_15': 11,
      'craft_beers': 12,
      'beer_buckets_under_40': 13,
      'wines_under_12': 20,
      'wines_under_15': 21,
      'bottles_under_100': 22,
      'cocktails_under_12': 30,
      'cocktails_under_15': 31,
      'signature_cocktails': 32,
      'whisky_deals': 40,
      'gin_deals': 41,
      '1for1_deals': 50,
      'freeflow_deals': 51,
      'two_bottle_discounts': 52,
      'cbd_deals': 60,
      'orchard_deals': 61,
      'holland_village_deals': 62
    };
    
    // Sort collections using our manual ordering
    const sortedCollections = [...allCollections].sort((a, b) => {
      // Make sure "active_happy_hours" always comes first
      if (a.slug === 'active_happy_hours') return -999; // Always first
      if (b.slug === 'active_happy_hours') return 999;  // Always first
      
      // Use the manual sort order if available (with type safety)
      const aOrder = a.slug ? (manualSortOrder[a.slug] || a.priority || 999) : 999;
      const bOrder = b.slug ? (manualSortOrder[b.slug] || b.priority || 999) : 999;
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