import express from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { deals, establishments } from '@shared/schema';
import { eq, and, asc, sql, gte, lte } from 'drizzle-orm';

const router = express.Router();

/**
 * Get active deals for the nearest establishments
 * This endpoint is used for the main deals discovery screen
 * 
 * Query Parameters:
 * - lat: latitude of user location
 * - lng: longitude of user location
 * - radius: radius in kilometers (default: 1km)
 */
router.get('/nearby', async (req, res) => {
  try {
    const latitude = parseFloat(req.query.lat as string);
    const longitude = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 1; // Default 1km
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }
    
    const activeDeals = await storage.getActiveDeals(latitude, longitude, radius);
    const upcomingDeals = await storage.getUpcomingDeals(latitude, longitude, radius);
    
    res.json({
      active: activeDeals,
      upcoming: upcomingDeals
    });
  } catch (error) {
    console.error("Error fetching nearby deals:", error);
    res.status(500).json({ message: "Failed to fetch nearby deals" });
  }
});

/**
 * Get deal details with establishment info
 * This is the first step of the deal-to-restaurant workflow
 * When a user clicks on a deal card, they see full deal details
 */
router.get('/:id', async (req, res) => {
  try {
    const dealId = parseInt(req.params.id);
    if (isNaN(dealId)) {
      return res.status(400).json({ message: "Invalid deal ID" });
    }
    
    const deal = await storage.getDealDetails(dealId);
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }
    
    res.json(deal);
  } catch (error) {
    console.error("Error fetching deal details:", error);
    res.status(500).json({ message: "Failed to fetch deal details" });
  }
});

/**
 * Search deals
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string || '';
    const filters = {
      type: req.query.type as string | undefined,
      status: req.query.status as string | undefined
    };
    
    const deals = await storage.searchDeals(query, filters);
    
    res.json(deals);
  } catch (error) {
    console.error("Error searching deals:", error);
    res.status(500).json({ message: "Failed to search deals" });
  }
});

/**
 * Get all deals with collections
 * This endpoint fetches all deals with their collections for the Collections UI
 * 
 * Query Parameters:
 * - lat: latitude of user location (optional)
 * - lng: longitude of user location (optional)
 * - radius: radius in kilometers (optional, default: 5km)
 */
router.get('/collections/all', async (req, res) => {
  try {
    // Extra debug logging
    console.log('Collections/all API called, headers:', req.headers);
    
    // Set proper content type
    res.setHeader('Content-Type', 'application/json');
    
    // Get location params if provided
    const latitude = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const longitude = req.query.lng ? parseFloat(req.query.lng as string) : null;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5; // Default 5km radius
    
    // Debug location parameters
    console.log('Location parameters received:', {
      lat: req.query.lat, 
      parsedLat: latitude,
      lng: req.query.lng, 
      parsedLng: longitude,
      radius: radius,
      urlParameters: req.url
    });
    
    // Base query first - we'll add the haversine calculation to each result later
    let query = db
      .select({
        deal: deals,
        establishment: establishments
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id));
    
    // We'll filter by coordinates if provided, but in a different way
    if (latitude !== null && longitude !== null) {
      // We'll fetch establishments within a rough bounding box first
      // This is more efficient than calculating haversine for every row
      const latDelta = radius / 111.0; // Approx 111km per degree of latitude
      const lngDelta = radius / (111.0 * Math.cos(latitude * Math.PI / 180.0)); // Adjust for longitude
      
      query = query.where(
        and(
          gte(establishments.latitude, latitude - latDelta),
          lte(establishments.latitude, latitude + latDelta),
          gte(establishments.longitude, longitude - lngDelta),
          lte(establishments.longitude, longitude + lngDelta)
        )
      );
    }
    
    // Add ordering - by category only (we'll sort by distance later)
    query = query.orderBy(asc(deals.alcohol_category));
    
    // Execute the query
    const result = await query;
    
    // Log for debugging
    console.log(`Fetched ${result.length} deals from database`);
    
    // Transform to DealWithEstablishment format with distance
    const dealsWithDistances = result.map(item => {
      // Calculate distance manually if coordinates are provided
      let distance = null;
      if (latitude !== null && longitude !== null) {
        // Use the haversine formula to calculate distance
        const R = 6371; // Radius of the earth in km
        const lat1 = latitude;
        const lon1 = longitude;
        const lat2 = item.establishment.latitude;
        const lon2 = item.establishment.longitude;
        
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const calculatedDistance = R * c; // Distance in km
        
        distance = parseFloat(calculatedDistance.toFixed(2));
      }
      
      return {
        ...item.deal,
        establishment: item.establishment,
        distance
      };
    });
    
    // Filter out deals that are farther than the radius (the box query is approximate)
    let dealsWithEstablishments = dealsWithDistances;
    if (latitude !== null && longitude !== null) {
      dealsWithEstablishments = dealsWithDistances.filter(deal => 
        deal.distance !== null && deal.distance <= radius
      );
      
      // Sort by distance (closest first)
      dealsWithEstablishments.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }
    
    // If no deals found, return empty array instead of error
    if (dealsWithEstablishments.length === 0) {
      console.log('No deals found in database, returning empty array');
    }
    
    // Send response directly without using express json middleware
    return res.send(JSON.stringify(dealsWithEstablishments || []));
  } catch (error) {
    console.error("Error fetching deals with collections:", error);
    res.status(500).json({ message: "Failed to fetch deals with collections" });
  }
});

/**
 * Get deals by collection
 * This endpoint fetches deals that belong to a specific collection
 */
router.get('/collections/:collectionName', async (req, res) => {
  try {
    const collectionName = req.params.collectionName;
    
    // Fetch deals that have this collection in their collections field
    const result = await db
      .select({
        deal: deals,
        establishment: establishments
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id))
      .where(sql`${deals.collections} LIKE ${'%' + collectionName + '%'}`);
    
    // Transform to DealWithEstablishment format
    const dealsInCollection = result.map(item => ({
      ...item.deal,
      establishment: item.establishment
    }));
    
    res.json(dealsInCollection);
  } catch (error) {
    console.error(`Error fetching deals for collection ${req.params.collectionName}:`, error);
    res.status(500).json({ message: "Failed to fetch deals for collection" });
  }
});

export default router;