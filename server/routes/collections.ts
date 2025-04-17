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
    // Get all collections and sort by priority (lowest first)
    const allCollections = await db.select()
      .from(collections)
      .orderBy(collections.priority);
    
    console.log('Returning collections sorted by priority:', 
      allCollections.map(c => `${c.name} (priority: ${c.priority})`));
    
    return res.json(allCollections);
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