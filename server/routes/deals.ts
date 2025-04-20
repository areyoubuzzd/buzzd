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
    
    // Get optional query parameters for location
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5;
    
    console.log(`Collection deals API called for "${collectionName}" with location: lat=${lat}, lng=${lng}, radius=${radius}`);
    
    // ABSOLUTELY CRITICAL FIX: Special handling for active_happy_hours collection
    let result;
    
    if (collectionName === 'active_happy_hours') {
      console.log('SPECIAL HANDLING: active_happy_hours collection - fetching ALL 25 deals regardless of distance');
      
      // For active_happy_hours, fetch ALL deals with this collection tag without filtering
      result = await db
        .select({
          deal: deals,
          establishment: establishments
        })
        .from(deals)
        .innerJoin(establishments, eq(deals.establishmentId, establishments.id))
        .where(sql`${deals.collections} LIKE ${'%active_happy_hours%'}`);
      
      console.log(`Fetched ${result.length} deals from database for active_happy_hours`);
    } else {
      // For other collections, use the normal query with distance filtering
      result = await db
        .select({
          deal: deals,
          establishment: establishments
        })
        .from(deals)
        .innerJoin(establishments, eq(deals.establishmentId, establishments.id))
        .where(sql`${deals.collections} LIKE ${'%' + collectionName + '%'}`);
        
      console.log(`Fetched ${result.length} deals from database for "${collectionName}"`);
    }
    
    // Transform to DealWithEstablishment format - with distance calculation
    const dealsInCollection = result.map(item => {
      // Calculate distance if location is provided
      let distance = null;
      if (lat !== null && lng !== null) {
        const R = 6371; // Radius of the earth in km
        const lat1 = lat;
        const lon1 = lng;
        const lat2 = item.establishment.latitude;
        const lon2 = item.establishment.longitude;
        
        if (lat2 !== null && lon2 !== null) {
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const calculatedDistance = R * c; // Distance in km
          
          distance = parseFloat(calculatedDistance.toFixed(2));
          
          // Log establishments near the boundary
          if (distance > radius * 0.95 && distance <= radius * 1.1) {
            console.log(`Establishment ${item.establishment.name} is near radius boundary: ${distance} km (radius: ${radius} km)`);
          }
        }
      }
      
      return {
        ...item.deal,
        establishment: item.establishment,
        distance
      };
    });
    
    // Add active status to each deal based on current day and time
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Convert hours and minutes to a decimal value for easy comparison (in minutes)
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Debug time value
    console.log(`Current day: ${currentDay}, time value: ${currentTime} minutes`);
    
    const dealsWithActiveStatus = dealsInCollection.map(deal => {
      // Parse valid days from the deal's valid_days field
      const validDaysLower = deal.valid_days ? deal.valid_days.toLowerCase() : 'none';
      let isDealActiveDay = false;
      
      // Check if the current day matches the valid days
      if (validDaysLower === 'all days' || validDaysLower.includes('everyday') || validDaysLower.includes('all')) {
        // "all days", "everyday", "all" mean the deal is valid any day
        isDealActiveDay = true;
      } else if (validDaysLower.includes('mon') && currentDay === 1) {
        isDealActiveDay = true;
      } else if (validDaysLower.includes('tue') && currentDay === 2) {
        isDealActiveDay = true;
      } else if (validDaysLower.includes('wed') && currentDay === 3) {
        isDealActiveDay = true;
      } else if (validDaysLower.includes('thu') && currentDay === 4) {
        isDealActiveDay = true;
      } else if (validDaysLower.includes('fri') && currentDay === 5) {
        isDealActiveDay = true;
      } else if (validDaysLower.includes('sat') && currentDay === 6) {
        isDealActiveDay = true;
      } else if (validDaysLower.includes('sun') && currentDay === 0) {
        isDealActiveDay = true;
      } else if (validDaysLower.includes('-')) {
        // Handle day ranges like "mon-fri"
        const dayParts = validDaysLower.split('-');
        if (dayParts.length === 2) {
          const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          const startDayValue = days.findIndex(d => dayParts[0].trim().toLowerCase().startsWith(d));
          const endDayValue = days.findIndex(d => dayParts[1].trim().toLowerCase().startsWith(d));
          
          if (startDayValue !== -1 && endDayValue !== -1) {
            isDealActiveDay = currentDay >= startDayValue && currentDay <= endDayValue;
            console.log(`Range check: ${startDayValue} <= ${currentDay} <= ${endDayValue} => ${isDealActiveDay}`);
          }
        }
      }
      
      // Parse start and end times from hh_start_time and hh_end_time fields
      const startTimeStr = deal.hh_start_time || "00:00";
      const endTimeStr = deal.hh_end_time || "00:00";
      
      // Convert HH:MM to minutes
      const convertTimeToMinutes = (timeStr: string): number => {
        const parts = timeStr.split(':');
        if (parts.length === 2) {
          return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return 0;
      };
      
      const startTimeValue = convertTimeToMinutes(startTimeStr);
      const endTimeValue = convertTimeToMinutes(endTimeStr);
      
      console.log(`Start time raw: "${startTimeStr}", parsed: ${startTimeValue}`);
      console.log(`End time raw: "${endTimeStr}", parsed: ${endTimeValue}`);
      console.log(`Current time value: ${currentTime}`);
      
      // Check if current time is within happy hour
      const isActiveTime = currentTime >= startTimeValue && currentTime <= endTimeValue;
      
      // Deal is active if both day and time conditions are met
      const isActive = isDealActiveDay && isActiveTime;
      
      if (isActive) {
        console.log(`Deal "${deal.drink_name}" from establishment ${deal.establishmentId} is ACTIVE (${currentTime} is between ${startTimeValue} and ${endTimeValue})`);
      }
      
      return {
        ...deal,
        isActive
      };
    });
    
    // ABSOLUTELY CRITICAL FIX: Force active deals to ALWAYS come first using a two-step sort
    // First split active and inactive deals into separate arrays
    const activeDeals = dealsWithActiveStatus.filter(deal => deal.isActive);
    const inactiveDeals = dealsWithActiveStatus.filter(deal => !deal.isActive);
    
    console.log(`SPLIT DEALS: ${activeDeals.length} active deals, ${inactiveDeals.length} inactive deals`);
    
    // Now sort each array individually by secondary criteria
    function sortDealsBySecondaryFactors(deals) {
      return deals.sort((a, b) => {
        // First sort by sort_order if available
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }
        }
        
        // Then by distance if available
        if (a.distance !== undefined && b.distance !== undefined) {
          if (a.distance !== b.distance) {
            return a.distance - b.distance;
          }
        }
        
        // Finally by price
        if (a.happy_hour_price !== undefined && b.happy_hour_price !== undefined) {
          return a.happy_hour_price - b.happy_hour_price;
        }
        
        // Default to ID if nothing else works
        return a.id - b.id;
      });
    }
    
    // Sort each group by secondary factors
    const sortedActiveDeals = sortDealsBySecondaryFactors(activeDeals);
    const sortedInactiveDeals = sortDealsBySecondaryFactors(inactiveDeals);
    
    // Finally, combine the arrays - active deals will ALWAYS come first
    const sortedDeals = [...sortedActiveDeals, ...sortedInactiveDeals];

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