/**
 * API routes for location services including postal code search
 */
import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

/**
 * Search for locations by name, area, or alternate names
 * GET /api/locations/search?query=raffles
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters' 
      });
    }
    
    const locations = await storage.searchLocationsByQuery(query);
    
    return res.json({
      success: true,
      locations
    });
  } catch (error) {
    console.error('Error searching locations:', error);
    return res.status(500).json({ 
      error: 'Failed to search locations' 
    });
  }
});

/**
 * Lookup a location by postal code
 * GET /api/locations/postal-code/123456
 */
router.get('/postal-code/:code', async (req: Request, res: Response) => {
  try {
    const postalCode = req.params.code;
    
    if (!postalCode || postalCode.length < 2) {
      return res.status(400).json({ 
        error: 'Postal code must be at least 2 characters' 
      });
    }
    
    const location = await storage.getLocationByPostalCode(postalCode);
    
    if (!location) {
      return res.status(404).json({ 
        error: 'No location found for this postal code' 
      });
    }
    
    return res.json({
      success: true,
      location
    });
  } catch (error) {
    console.error('Error looking up postal code:', error);
    return res.status(500).json({ 
      error: 'Failed to lookup postal code' 
    });
  }
});

/**
 * Get nearby locations based on coordinates
 * GET /api/locations/nearby?lat=1.3521&lng=103.8198&radius=5
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      lat: z.string().transform(val => parseFloat(val)),
      lng: z.string().transform(val => parseFloat(val)),
      radius: z.string().default('5').transform(val => parseFloat(val))
    });
    
    const result = schema.safeParse(req.query);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Invalid coordinates. Required: lat, lng, optional: radius (in km)' 
      });
    }
    
    const { lat, lng, radius } = result.data;
    
    const locations = await storage.getNearbyLocations(lat, lng, radius);
    
    return res.json({
      success: true,
      locations
    });
  } catch (error) {
    console.error('Error finding nearby locations:', error);
    return res.status(500).json({ 
      error: 'Failed to find nearby locations' 
    });
  }
});

/**
 * Get locations by district (first 2 digits of postal code)
 * GET /api/locations/district/01
 */
router.get('/district/:code', async (req: Request, res: Response) => {
  try {
    const districtCode = req.params.code;
    
    if (!districtCode || districtCode.length !== 2) {
      return res.status(400).json({ 
        error: 'District code must be exactly 2 digits' 
      });
    }
    
    const locations = await storage.getLocationsByDistrict(districtCode);
    
    return res.json({
      success: true,
      locations
    });
  } catch (error) {
    console.error('Error getting locations by district:', error);
    return res.status(500).json({ 
      error: 'Failed to get locations by district' 
    });
  }
});

export default router;