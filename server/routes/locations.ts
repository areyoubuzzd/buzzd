/**
 * API routes for location services including postal code search
 */
import express, { Request, Response } from 'express';
import { db } from '../db';
import { singaporeLocations } from '../../shared/schema';
import { eq, like, or, ilike, sql } from 'drizzle-orm';
import { haversineDistance } from '../../client/src/utils/distance';

const router = express.Router();

/**
 * Search for locations by name, area, or alternate names
 * GET /api/locations/search?query=raffles
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    // Search by name, area, or alternate names
    const results = await db
      .select()
      .from(singaporeLocations)
      .where(
        or(
          ilike(singaporeLocations.name, `%${query}%`),
          ilike(singaporeLocations.area, `%${query}%`),
          ilike(singaporeLocations.alternateNames, `%${query}%`)
        )
      )
      .limit(10);
    
    return res.json(results);
  } catch (error) {
    console.error('Error searching locations:', error);
    return res.status(500).json({ error: 'Failed to search locations' });
  }
});

/**
 * Lookup a location by postal code
 * GET /api/locations/postal-code/123456
 */
router.get('/postal-code/:code', async (req: Request, res: Response) => {
  try {
    const postalCode = req.params.code;
    if (!postalCode || !/^\d{6}$/.test(postalCode)) {
      return res.status(400).json({ 
        error: 'Invalid postal code format. Singapore postal codes must be 6 digits.' 
      });
    }
    
    // First, try for exact match
    const exactMatch = await db
      .select()
      .from(singaporeLocations)
      .where(eq(singaporeLocations.postalCode, postalCode))
      .limit(1);
    
    if (exactMatch.length > 0) {
      return res.json(exactMatch[0]);
    }
    
    // If no exact match, check postal district (first 2 digits)
    const postalDistrict = postalCode.substring(0, 2);
    const districtMatches = await db
      .select()
      .from(singaporeLocations)
      .where(eq(singaporeLocations.postalDistrict, postalDistrict))
      .limit(5);
    
    if (districtMatches.length > 0) {
      // Return the most popular location in that district
      const popularMatch = districtMatches.find(loc => loc.isPopular);
      if (popularMatch) {
        return res.json({
          ...popularMatch,
          matchType: 'district',
          message: 'Exact postal code not found. Using location in the same district.'
        });
      }
      return res.json({
        ...districtMatches[0],
        matchType: 'district',
        message: 'Exact postal code not found. Using location in the same district.'
      });
    }
    
    // If still no match, return the closest major area/neighborhood
    return res.status(404).json({ 
      error: 'Location not found for this postal code',
      suggestion: 'Try searching by area name instead or use your current location'
    });
  } catch (error) {
    console.error('Error looking up postal code:', error);
    return res.status(500).json({ error: 'Failed to lookup postal code' });
  }
});

/**
 * Get nearby locations based on coordinates
 * GET /api/locations/nearby?lat=1.3521&lng=103.8198&radius=5
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    let radius = parseFloat(req.query.radius as string) || 5; // Default to 5km
    
    // Validate parameters
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }
    
    // Cap radius at reasonable value
    radius = Math.min(radius, 20); // Maximum 20km
    
    // Calculate Haversine distance in the database query 
    // for more efficient filtering
    const haversineQuery = sql`
      6371 * acos(
        cos(radians(${lat})) * cos(radians(${singaporeLocations.latitude})) * 
        cos(radians(${singaporeLocations.longitude}) - radians(${lng})) + 
        sin(radians(${lat})) * sin(radians(${singaporeLocations.latitude}))
      )`;
    
    // Query with distance calculation and filtering
    const nearbyLocations = await db
      .select({
        ...singaporeLocations,
        distance: haversineQuery
      })
      .from(singaporeLocations)
      .where(sql`${haversineQuery} <= ${radius}`)
      .orderBy(haversineQuery)
      .limit(10);
    
    return res.json(nearbyLocations);
  } catch (error) {
    console.error('Error finding nearby locations:', error);
    return res.status(500).json({ error: 'Failed to find nearby locations' });
  }
});

export default router;