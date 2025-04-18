/**
 * API routes for location services including postal code search
 */
import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = express.Router();

/**
 * Search for locations by name, area, or alternate names
 * GET /api/locations/search?query=raffles
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        error: 'Query parameter must be at least 2 characters' 
      });
    }
    
    const locations = await storage.searchLocationsByQuery(query);
    return res.json(locations);
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
    
    // Validate the postal code format (Singapore postal codes are 6 digits)
    if (!/^\d{6}$/.test(postalCode)) {
      return res.status(400).json({ 
        error: 'Invalid postal code format. Singapore postal codes should be 6 digits.' 
      });
    }
    
    const location = await storage.getLocationByPostalCode(postalCode);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found for this postal code' });
    }
    
    return res.json(location);
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
    const querySchema = z.object({
      lat: z.string().transform(s => parseFloat(s)),
      lng: z.string().transform(s => parseFloat(s)),
      radius: z.string().optional().transform(s => parseFloat(s || '5')), // Default 5km radius
    });
    
    const result = querySchema.safeParse(req.query);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Invalid parameters. Please provide valid lat and lng coordinates.'
      });
    }
    
    const { lat, lng, radius } = result.data;
    
    // Basic validation for coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    const locations = await storage.getNearbyLocations(lat, lng, radius);
    return res.json(locations);
  } catch (error) {
    console.error('Error finding nearby locations:', error);
    return res.status(500).json({ error: 'Failed to find nearby locations' });
  }
});

/**
 * Get locations by district (first 2 digits of postal code)
 * GET /api/locations/district/01
 */
router.get('/district/:code', async (req: Request, res: Response) => {
  try {
    const district = req.params.code;
    
    // Validate the district format (first 2 digits of postal code)
    if (!/^\d{2}$/.test(district)) {
      return res.status(400).json({ 
        error: 'Invalid district format. District should be 2 digits (first 2 digits of postal code).' 
      });
    }
    
    const locations = await storage.getLocationsByDistrict(district);
    
    if (locations.length === 0) {
      return res.status(404).json({ error: 'No locations found for this district' });
    }
    
    return res.json(locations);
  } catch (error) {
    console.error('Error looking up district:', error);
    return res.status(500).json({ error: 'Failed to lookup district' });
  }
});

export default router;