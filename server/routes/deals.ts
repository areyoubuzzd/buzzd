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
    const baseQuery = db
      .select({
        deal: deals,
        establishment: establishments
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id));
    
    // Execute query with different filters based on coordinates
    let dbResult;
    if (latitude !== null && longitude !== null) {
      // Calculate bounding box
      const latDelta = radius / 111.0;
      const lngDelta = radius / (111.0 * Math.cos(latitude * Math.PI / 180.0));
      
      // Query with location filter
      dbResult = await baseQuery
        .where(
          and(
            gte(establishments.latitude, latitude - latDelta),
            lte(establishments.latitude, latitude + latDelta),
            gte(establishments.longitude, longitude - lngDelta),
            lte(establishments.longitude, longitude + lngDelta)
          )
        )
        .orderBy(asc(deals.alcohol_category));
    } else {
      // Query without location filter
      dbResult = await baseQuery.orderBy(asc(deals.alcohol_category));
    }
    
    // Extra debug logging for Moon Rooftop Bar (id 11)
    const moonDeals = dbResult.filter(item => item.establishment.id === 11);
    if (moonDeals.length > 0) {
      console.log(`FOUND ${moonDeals.length} DEALS FROM MOON ROOFTOP BAR (ID 11) IN DATABASE QUERY RESULTS`);
      
      // Log the first deal
      console.log("First deal for establishment:", moonDeals[0].deal);
    } else {
      console.log(`Moon Rooftop Bar (id 11) NOT FOUND in database query results`);
    }
    
    // Log for debugging
    console.log(`Fetched ${dbResult.length} deals from database`);
    
    // Transform to DealWithEstablishment format with distance
    // and filter by actual distance
    const dealsWithEstablishments = dbResult
      .map((item: { deal: any; establishment: any }) => {
        // Calculate distance manually for each establishment
        let distance = null;
        
        // Only calculate if we have coordinates for both user and establishment
        if (latitude !== null && longitude !== null && 
            item.establishment.latitude && item.establishment.longitude) {
          
          // Haversine formula for precise distance calculation
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
          
          // Debug for key establishments
          if (item.establishment.id === 11) {
            console.log(`Distance from ${lat1},${lon1} to Moon Rooftop Bar (${lat2},${lon2}): ${distance} km`);
          }
        }
        
        return {
          ...item.deal,
          establishment: item.establishment,
          distance
        };
      })
      // IMPORTANT: Filter by actual calculated distance
      .filter((deal: any) => {
        // If no location provided, include all deals
        if (latitude === null || longitude === null) {
          return true;
        }
        
        // Check if the establishment has valid coordinates
        if (!deal.establishment || 
            deal.establishment.latitude === null || 
            deal.establishment.longitude === null) {
          console.log(`Establishment ${deal.establishment?.name || 'Unknown'} is missing coordinates`);
          return false;
        }
        
        // If distance calculation failed, exclude
        if (deal.distance === null) {
          return false;
        }
        
        // Only include deals within the radius
        const isWithinRadius = deal.distance <= radius;
        
        // Debug for establishments near boundary
        if (deal.distance > radius - 0.5 && deal.distance <= radius + 0.5) {
          console.log(`Establishment ${deal.establishment.name} is near radius boundary: ${deal.distance} km (radius: ${radius} km)`);
        }
        
        return isWithinRadius;
      })
      // Sort establishments by distance
      .sort((a: any, b: any) => {
        // If no distance info available, sort by name
        if (a.distance === null && b.distance === null) {
          return a.establishment.name.localeCompare(b.establishment.name);
        }
        if (a.distance === null) return 1;  // Push items without distance to the end
        if (b.distance === null) return -1;
        
        // Sort by distance (closest first)
        return a.distance - b.distance;
      });
    
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
    
    // Add active status to each deal based on current day and time
    const now = new Date();
    const currentDay = now.getDay();
    // Convert hours and minutes to a decimal value for easy comparison
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const dealsWithActiveStatus = dealsInCollection.map(deal => {
      // Parse happy hour days
      const happyHourDays = deal.happyHourDays ? deal.happyHourDays.split(',').map(day => parseInt(day.trim())) : [];
      
      // Check if today is a happy hour day
      const isDealActiveDay = happyHourDays.includes(currentDay);
      
      // Parse start and end times
      const startTimeParts = deal.startTime ? deal.startTime.split(':') : ['0', '0'];
      const endTimeParts = deal.endTime ? deal.endTime.split(':') : ['0', '0'];
      
      const startTimeValue = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
      const endTimeValue = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
      
      // Check if current time is within happy hour
      const isActiveTime = currentTime >= startTimeValue && currentTime <= endTimeValue;
      
      // Deal is active if both day and time conditions are met
      const isActive = isDealActiveDay && isActiveTime;
      
      return {
        ...deal,
        isActive
      };
    });
    
    // CRITICAL FIX: Force active deals to ALWAYS come first, then sort by other criteria
    // Add a numeric "sort_value" property to each deal for precise sorting
    const dealsWithSortValue = dealsWithActiveStatus.map(deal => {
      let sortValue = 0;
      
      // Active status is the most important (1000 points)
      if (deal.isActive) {
        sortValue += 1000;
      }
      
      // Sort order is second most important (if present) - up to 100 points
      if (deal.sort_order !== undefined && deal.sort_order !== null) {
        // Lower sort_order values should come first (higher sortValue)
        sortValue += 100 - Math.min(99, deal.sort_order);
      }
      
      // Distance is third most important - up to 10 points
      // Closer distances get higher sortValue
      if (deal.distance !== undefined && deal.distance !== null) {
        // Max 10 points for distance - transform from 0-50km to 10-0 points
        const distancePoints = Math.max(0, 10 - (deal.distance / 5));
        sortValue += distancePoints;
      }
      
      // Price is least important - up to 1 point
      // Lower prices get higher sortValue
      if (deal.happy_hour_price !== undefined && deal.happy_hour_price !== null) {
        // Max 1 point for price - transform from $0-$100 to 1-0 points
        const pricePoints = Math.max(0, 1 - (deal.happy_hour_price / 100));
        sortValue += pricePoints;
      }
      
      return { ...deal, sort_value: sortValue };
    });
    
    // Sort using the calculated sort value (higher values first)
    const sortedDeals = dealsWithSortValue.sort((a, b) => {
      return b.sort_value - a.sort_value;
    });

    // Debug logging to check the first 5 sorted deals
    console.log(`COLLECTION DEALS SORTING: Collection "${collectionName}" has ${sortedDeals.length} deals`);
    console.log(`FIRST 5 DEALS IN COLLECTION:`);
    sortedDeals.slice(0, 5).forEach((deal, i) => {
      console.log(`Deal #${i+1}: ${deal.drink_name} - ACTIVE: ${deal.isActive}, Price: $${deal.happy_hour_price}`);
    });
    
    res.json(sortedDeals);
  } catch (error) {
    console.error(`Error fetching deals for collection ${req.params.collectionName}:`, error);
    res.status(500).json({ message: "Failed to fetch deals for collection" });
  }
});

export default router;