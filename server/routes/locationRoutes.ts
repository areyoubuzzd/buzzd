import express from 'express';
import { storage } from '../storage';

const router = express.Router();

/**
 * Search locations by query string
 * This endpoint allows searching by partial name, postal code, or area
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const locations = await storage.searchLocationsByQuery(query);
    return res.json(locations);
  } catch (error) {
    console.error('Error searching locations:', error);
    return res.status(500).json({ error: 'Failed to search locations' });
  }
});

/**
 * Get location by postal code
 * Provides precise location data for a given postal code
 */
router.get('/postal/:postalCode', async (req, res) => {
  try {
    const { postalCode } = req.params;
    
    if (!postalCode) {
      return res.status(400).json({ error: 'Postal code is required' });
    }
    
    const location = await storage.getLocationByPostalCode(postalCode);
    
    if (!location) {
      // If exact postal code not found, try to find locations in the same postal district
      const postalDistrict = postalCode.substring(0, 2);
      const districtLocations = await storage.getLocationsByDistrict(postalDistrict);
      
      if (districtLocations.length > 0) {
        return res.json({
          exactMatch: false,
          postalDistrict,
          locations: districtLocations
        });
      }
      
      return res.status(404).json({ error: 'Location not found for postal code' });
    }
    
    return res.json({
      exactMatch: true,
      location
    });
  } catch (error) {
    console.error('Error fetching location by postal code:', error);
    return res.status(500).json({ error: 'Failed to fetch location by postal code' });
  }
});

/**
 * Get locations by district
 * Returns all locations in a specific postal district (e.g., "01" for Central)
 */
router.get('/district/:postalDistrict', async (req, res) => {
  try {
    const { postalDistrict } = req.params;
    
    if (!postalDistrict) {
      return res.status(400).json({ error: 'Postal district is required' });
    }
    
    const locations = await storage.getLocationsByDistrict(postalDistrict);
    
    if (locations.length === 0) {
      return res.status(404).json({ error: 'No locations found for postal district' });
    }
    
    return res.json(locations);
  } catch (error) {
    console.error('Error fetching locations by district:', error);
    return res.status(500).json({ error: 'Failed to fetch locations by district' });
  }
});

/**
 * Get nearby locations
 * Returns locations within a specified radius of the given coordinates
 */
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);
    
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      return res.status(400).json({ error: 'Invalid coordinate or radius values' });
    }
    
    const locations = await storage.getNearbyLocations(latitude, longitude, radiusKm);
    
    return res.json({
      latitude,
      longitude,
      radiusKm,
      count: locations.length,
      locations
    });
  } catch (error) {
    console.error('Error fetching nearby locations:', error);
    return res.status(500).json({ error: 'Failed to fetch nearby locations' });
  }
});

/**
 * Get popular locations
 * Returns a list of popular locations for the location picker
 */
router.get('/popular', async (req, res) => {
  try {
    const locations = await storage.searchLocationsByQuery('');
    const popularLocations = locations.filter(location => location.isPopular);
    
    return res.json(popularLocations);
  } catch (error) {
    console.error('Error fetching popular locations:', error);
    return res.status(500).json({ error: 'Failed to fetch popular locations' });
  }
});

export default router;