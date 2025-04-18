import { Router } from 'express';
import { db } from '../db';
import { eq, ilike, or, sql, desc, asc } from 'drizzle-orm';
import { singaporeLocations } from '@shared/schema';

const router = Router();

/**
 * Search Singapore locations by name, area, or alternate names
 * GET /api/locations/search?q=query
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        error: 'Search query parameter (q) is required and must be a string' 
      });
    }

    const searchTerm = `%${q}%`; // Add wildcards for partial matching
    
    const locations = await db
      .select()
      .from(singaporeLocations)
      .where(
        or(
          ilike(singaporeLocations.name, searchTerm),
          ilike(singaporeLocations.area, searchTerm),
          ilike(singaporeLocations.alternateNames as any, searchTerm)
        )
      )
      .orderBy((cols) => [
        desc(cols.isPopular),
        asc(cols.name)
      ]);
      
    res.json(locations);
  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({ error: 'Failed to search locations' });
  }
});

/**
 * Get popular locations
 * GET /api/locations/popular
 */
router.get('/popular', async (req, res) => {
  try {
    const locations = await db
      .select()
      .from(singaporeLocations)
      .where(eq(singaporeLocations.isPopular, true))
      .orderBy((cols) => [
        asc(cols.name)
      ]);
      
    res.json(locations);
  } catch (error) {
    console.error('Error fetching popular locations:', error);
    res.status(500).json({ error: 'Failed to fetch popular locations' });
  }
});

/**
 * Get all locations
 * GET /api/locations/all
 */
router.get('/all', async (req, res) => {
  try {
    const locations = await db
      .select()
      .from(singaporeLocations)
      .orderBy((cols) => [
        asc(cols.name)
      ]);
      
    res.json(locations);
  } catch (error) {
    console.error('Error fetching all locations:', error);
    res.status(500).json({ error: 'Failed to fetch all locations' });
  }
});

export default router;