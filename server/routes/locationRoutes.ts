import express from 'express';
import { storage } from '../storage';

const router = express.Router();

/**
 * Search locations by query string
 * This endpoint allows searching by partial name, postal code, or area
 */
// Original search with query parameter
router.get('/search', async (req, res) => {
  try {
    // Try to access the query parameter sent from the client
    let query = '';
    
    if (req.query && typeof req.query === 'object') {
      if ('q' in req.query) {
        query = String(req.query.q || '');
      } else if ('query' in req.query) {
        // Also try 'query' as an alternative parameter name
        query = String(req.query.query || '');
      }
    }
    
    console.log('Location search query:', query, 'Type:', typeof query, 'Length:', query.length);
    console.log('Raw query parameters:', req.query);
    
    // Check if query meets minimum length requirement
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        success: false,
        error: 'Search query must be at least 2 characters' 
      });
    }
    
    const locations = await storage.searchLocationsByQuery(query);
    console.log(`Found ${locations.length} locations for query "${query}"`);
    res.json({
      success: true,
      locations: locations
    });
  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search locations' 
    });
  }
});

// Path parameter based search as an alternative
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    console.log('Location search by path param:', query);
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        success: false,
        error: 'Search query must be at least 2 characters' 
      });
    }
    
    const locations = await storage.searchLocationsByQuery(query);
    console.log(`Found ${locations.length} locations for query "${query}"`);
    res.json({
      success: true,
      locations: locations
    });
  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search locations' 
    });
  }
});

/**
 * Get location by postal code
 * Provides precise location data for a given postal code
 */
router.get('/postal-code/:postalCode', async (req, res) => {
  try {
    const postalCode = req.params.postalCode;
    
    if (!postalCode || postalCode.length < 2) {
      return res.status(400).json({ 
        success: false,
        error: 'Postal code must be at least 2 characters' 
      });
    }
    
    const location = await storage.getLocationByPostalCode(postalCode);
    
    if (!location) {
      return res.status(404).json({ 
        success: false,
        error: 'No location found for this postal code'
      });
    }
    
    res.json({
      success: true,
      location: location
    });
  } catch (error) {
    console.error('Error getting location by postal code:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get location' 
    });
  }
});

/**
 * Get locations by district
 * Returns all locations in a specific postal district (e.g., "01" for Central)
 */
router.get('/district/:district', async (req, res) => {
  try {
    const district = req.params.district;
    
    if (!district || district.length !== 2) {
      return res.status(400).json({ 
        success: false,
        error: 'District must be exactly 2 characters (e.g., "01" for Central)' 
      });
    }
    
    const locations = await storage.getLocationsByDistrict(district);
    
    if (locations.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'No locations found for this district'
      });
    }
    
    res.json({
      success: true,
      locations: locations
    });
  } catch (error) {
    console.error('Error getting locations by district:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get locations' 
    });
  }
});

/**
 * Get nearby locations
 * Returns locations within a specified radius of the given coordinates
 */
router.get('/nearby', async (req, res) => {
  try {
    const latitude = parseFloat(req.query.lat as string);
    const longitude = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 3; // Default 3km
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid coordinates. Please provide valid lat and lng parameters.' 
      });
    }
    
    const locations = await storage.getNearbyLocations(latitude, longitude, radius);
    
    res.json({
      success: true,
      locations: locations
    });
  } catch (error) {
    console.error('Error getting nearby locations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get nearby locations' 
    });
  }
});

/**
 * Get popular locations
 * Returns a list of popular locations for the location picker
 */
router.get('/popular', async (req, res) => {
  try {
    // This function doesn't exist yet in the storage interface,
    // so for now we'll use the district search for popular areas
    const centralLocations = await storage.getLocationsByDistrict('01'); // Central
    const eastLocations = await storage.getLocationsByDistrict('15');    // East Coast
    const northLocations = await storage.getLocationsByDistrict('57');   // Yishun
    
    // Combine and sort by popularity
    const popularLocations = [
      ...centralLocations,
      ...eastLocations,
      ...northLocations
    ].sort((a, b) => {
      // Sort by isPopular first, then by name
      if (a.isPopular === b.isPopular) {
        return a.name.localeCompare(b.name);
      }
      return a.isPopular ? -1 : 1;
    }).slice(0, 10); // Return top 10
    
    res.json({
      success: true,
      locations: popularLocations
    });
  } catch (error) {
    console.error('Error getting popular locations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get popular locations' 
    });
  }
});

export default router;