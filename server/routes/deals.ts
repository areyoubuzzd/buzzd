import express from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { deals, establishments } from '@shared/schema';
import { eq, and, asc, sql } from 'drizzle-orm';

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
    
    // Use SQL to calculate Haversine distance if coordinates are provided
    const haversine = latitude !== null && longitude !== null
      ? sql`
        6371 * acos(
          cos(radians(${latitude})) * 
          cos(radians(${establishments.latitude})) * 
          cos(radians(${establishments.longitude}) - radians(${longitude})) + 
          sin(radians(${latitude})) * 
          sin(radians(${establishments.latitude}))
        )
      `.as('distance')
      : sql`0`.as('distance');
    
    // Base query
    let query = db
      .select({
        deal: deals,
        establishment: establishments,
        distance: haversine
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id));
    
    // Add distance filter if coordinates are provided
    if (latitude !== null && longitude !== null) {
      query = query.where(
        sql`${haversine} <= ${radius}`
      );
    }
    
    // Add ordering - first by distance if coordinates are provided, then by category
    if (latitude !== null && longitude !== null) {
      query = query.orderBy(asc(haversine), asc(deals.alcohol_category));
    } else {
      query = query.orderBy(asc(deals.alcohol_category));
    }
    
    // Execute the query
    const result = await query;
    
    // Log for debugging
    console.log(`Fetched ${result.length} deals from database`);
    
    // Transform to DealWithEstablishment format with distance
    const dealsWithEstablishments = result.map(item => ({
      ...item.deal,
      establishment: item.establishment,
      distance: item.distance // Include the calculated distance
    }));
    
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