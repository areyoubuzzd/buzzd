/**
 * Fixed, Reliable Deployment Script for Replit
 * 
 * This script:
 * 1. Uses direct database access for all API endpoints
 * 2. Handles proper column naming for lat/lng vs latitude/longitude
 * 3. Serves the built React app in production
 */

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Initialize WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for deployment");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Add middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log startup info
console.log(`
=================================================
  BUZZD FIXED DEPLOYMENT SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}
Current Directory: ${process.cwd()}
=================================================
`);

// Helper function for Singapore time conversion
function getSingaporeTime(date = new Date()) {
  return new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (8 * 60 * 60000));
}

// API Routes
// 1. Get all establishments
app.get('/api/establishments', async (req, res) => {
  try {
    console.log('Getting all establishments...');
    const result = await pool.query(`
      SELECT 
        id,
        name,
        address,
        city,
        postal_code as "postalCode",
        latitude,
        longitude,
        cuisine,
        rating,
        price,
        priority,
        image_url as "imageUrl",
        image_id as "imageId",
        external_id as "externalId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM establishments 
      ORDER BY name ASC
    `);
    
    // Format response to add lat/lng fields that match client expectation
    const formattedRows = result.rows.map(row => ({
      ...row,
      lat: row.latitude,
      lng: row.longitude
    }));
    
    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching establishments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch establishments', 
      message: 'There was an error retrieving the data. Please try again later.',
      details: error.message
    });
  }
});

// 2. Get a specific establishment with its deals
app.get('/api/establishments/:establishmentId', async (req, res) => {
  try {
    const { establishmentId } = req.params;
    console.log(`API: Getting establishment ${establishmentId}`);
    
    // Validate establishmentId
    if (!establishmentId || isNaN(parseInt(establishmentId))) {
      console.error(`Invalid establishment ID: ${establishmentId}`);
      return res.status(400).json({
        error: 'Invalid establishment ID',
        message: 'Please provide a valid numeric establishment ID.'
      });
    }
    
    // Get the establishment
    const { rows: establishments } = await pool.query(
      `SELECT 
        id,
        name,
        address,
        city,
        postal_code as "postalCode",
        latitude,
        longitude,
        cuisine,
        rating,
        price,
        priority,
        image_url as "imageUrl",
        image_id as "imageId",
        external_id as "externalId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM establishments 
      WHERE id = $1`,
      [establishmentId]
    );
    
    if (establishments.length === 0) {
      return res.status(404).json({ error: 'Establishment not found' });
    }
    
    const establishment = establishments[0];
    
    // Transform to expected format
    establishment.lat = establishment.latitude;
    establishment.lng = establishment.longitude;
    
    // Get deals for this establishment
    const { rows: dealRows } = await pool.query(
      `SELECT 
        id,
        establishment_id as "establishmentId",
        alcohol_category,
        alcohol_subcategory,
        alcohol_subcategory2,
        drink_name,
        standard_price,
        happy_hour_price,
        savings,
        savings_percentage as "savingsPercentage",
        valid_days,
        hh_start_time,
        hh_end_time,
        collections,
        description,
        sort_order,
        image_url as "imageUrl",
        image_id as "imageId",
        cloudflare_image_id as "cloudflareImageId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM deals 
      WHERE establishment_id = $1`,
      [establishmentId]
    );
    
    // Convert to Singapore time for day/time validation
    const singaporeTime = getSingaporeTime();
    const currentDay = singaporeTime.getDay(); // 0-6, where 0 is Sunday
    
    // Get the current time in minutes since midnight (e.g., 8:30am = 510 minutes)
    const hours = singaporeTime.getHours();
    const minutes = singaporeTime.getMinutes();
    const currentTimeValue = hours * 60 + minutes;
    
    // Get the current day of the week in the format used in the valid_days field
    const dayMap = {
      0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
    };
    const currentDayStr = dayMap[currentDay];
    
    // Process deals to add isActive property
    const processedDeals = dealRows.map(deal => {
      const isForToday = deal.valid_days.includes(currentDayStr) || 
                        (deal.valid_days.includes('Everyday')) ||
                        (deal.valid_days.includes('Weekdays') && currentDay >= 1 && currentDay <= 5);
      
      // Convert time strings (HH:MM) to minutes since midnight
      const startTimeParts = deal.hh_start_time.split(':').map(Number);
      const endTimeParts = deal.hh_end_time.split(':').map(Number);
      
      const startTimeValue = startTimeParts[0] * 60 + startTimeParts[1];
      const endTimeValue = endTimeParts[0] * 60 + endTimeParts[1];
      
      // Determine if the deal is active based on the current time
      let isWithinTimeWindow = false;
      
      // Normal case (start time before end time, e.g., 16:00-20:00)
      if (startTimeValue <= endTimeValue) {
        isWithinTimeWindow = currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
      } 
      // Special case for deals that run overnight (e.g., 22:00-02:00)
      else {
        isWithinTimeWindow = currentTimeValue >= startTimeValue || currentTimeValue <= endTimeValue;
      }
      
      // Deal is active if it's for today and within the time window
      const isActive = isForToday && isWithinTimeWindow;
      
      // Add the isActive property to the deal object
      return { ...deal, isActive };
    });
    
    // Format the establishment data as expected by the client-side interface
    const formattedResponse = {
      establishment: establishment,
      activeDeals: processedDeals
    };
    
    console.log('Restaurant details endpoint returned:', JSON.stringify({
      id: establishment.id,
      name: establishment.name,
      dealsCount: processedDeals.length
    }));
    
    res.json(formattedResponse);
  } catch (error) {
    console.error(`Error fetching establishment ${req.params.establishmentId}:`, error);
    res.status(500).json({
      error: 'Failed to fetch establishment',
      message: 'There was an error retrieving the establishment. Please try again later.',
      details: error.message
    });
  }
});

// 3. Get all deals for a specific collection
app.get('/api/deals/collections/:collectionSlug', async (req, res) => {
  try {
    const { collectionSlug } = req.params;
    console.log(`Getting deals for collection: ${collectionSlug}`);
    
    // Get location parameters
    const lat = parseFloat(req.query.lat) || 1.3521; // Default to Singapore center
    const lng = parseFloat(req.query.lng) || 103.8198;
    const radius = parseFloat(req.query.radius) || 5; // Default 5km radius
    
    console.log('Location parameters received:', {
      lat: req.query.lat,
      parsedLat: lat,
      lng: req.query.lng, 
      parsedLng: lng,
      radius,
      urlParameters: req.url
    });
    
    let dealsQuery;
    let queryParams;
    
    if (collectionSlug === 'all') {
      // For "all" collection, just get all deals within radius
      dealsQuery = `
        SELECT 
          d.id,
          d.establishment_id as "establishmentId",
          d.alcohol_category,
          d.alcohol_subcategory,
          d.alcohol_subcategory2,
          d.drink_name,
          d.standard_price,
          d.happy_hour_price,
          d.savings,
          d.savings_percentage as "savingsPercentage",
          d.valid_days,
          d.hh_start_time,
          d.hh_end_time,
          d.collections,
          d.description,
          d.sort_order,
          d.image_url as "imageUrl",
          d.image_id as "imageId",
          d.cloudflare_image_id as "cloudflareImageId",
          d.created_at as "createdAt",
          d.updated_at as "updatedAt",
          e.name as "establishmentName",
          e.address as "establishmentAddress",
          e.city as "establishmentCity",
          e.postal_code as "establishmentPostalCode",
          e.latitude as "establishmentLat",
          e.longitude as "establishmentLng",
          e.cuisine as "establishmentCuisine",
          e.rating as "establishmentRating",
          e.image_url as "establishmentImageUrl",
          2 * 6371 * asin(
            sqrt(
              power(sin((radians($1) - radians(e.latitude)) / 2), 2) +
              cos(radians($1)) * cos(radians(e.latitude)) *
              power(sin((radians($2) - radians(e.longitude)) / 2), 2)
            )
          ) as "distance"
        FROM deals d
        JOIN establishments e ON d.establishment_id = e.id
        WHERE 2 * 6371 * asin(
          sqrt(
            power(sin((radians($1) - radians(e.latitude)) / 2), 2) +
            cos(radians($1)) * cos(radians(e.latitude)) *
            power(sin((radians($2) - radians(e.longitude)) / 2), 2)
          )
        ) <= $3
        ORDER BY "distance" ASC, d.sort_order ASC
      `;
      queryParams = [lat, lng, radius];
    } else {
      // For specific collections, filter by collection name
      dealsQuery = `
        SELECT 
          d.id,
          d.establishment_id as "establishmentId",
          d.alcohol_category,
          d.alcohol_subcategory,
          d.alcohol_subcategory2,
          d.drink_name,
          d.standard_price,
          d.happy_hour_price,
          d.savings,
          d.savings_percentage as "savingsPercentage",
          d.valid_days,
          d.hh_start_time,
          d.hh_end_time,
          d.collections,
          d.description,
          d.sort_order,
          d.image_url as "imageUrl",
          d.image_id as "imageId",
          d.cloudflare_image_id as "cloudflareImageId",
          d.created_at as "createdAt",
          d.updated_at as "updatedAt",
          e.name as "establishmentName",
          e.address as "establishmentAddress",
          e.city as "establishmentCity",
          e.postal_code as "establishmentPostalCode",
          e.latitude as "establishmentLat",
          e.longitude as "establishmentLng",
          e.cuisine as "establishmentCuisine",
          e.rating as "establishmentRating",
          e.image_url as "establishmentImageUrl",
          2 * 6371 * asin(
            sqrt(
              power(sin((radians($1) - radians(e.latitude)) / 2), 2) +
              cos(radians($1)) * cos(radians(e.latitude)) *
              power(sin((radians($2) - radians(e.longitude)) / 2), 2)
            )
          ) as "distance"
        FROM deals d
        JOIN establishments e ON d.establishment_id = e.id
        JOIN collections c ON c.slug = $4
        WHERE d.collections LIKE '%' || c.name || '%'
        AND 2 * 6371 * asin(
          sqrt(
            power(sin((radians($1) - radians(e.latitude)) / 2), 2) +
            cos(radians($1)) * cos(radians(e.latitude)) *
            power(sin((radians($2) - radians(e.longitude)) / 2), 2)
          )
        ) <= $3
        ORDER BY "distance" ASC, d.sort_order ASC
      `;
      queryParams = [lat, lng, radius, collectionSlug];
    }
    
    // Execute the query
    const { rows: dealsWithDistance } = await pool.query(dealsQuery, queryParams);
    
    // Get collection name for better context in logs
    const collectionName = collectionSlug === 'all' ? 'All Deals' : collectionSlug;
    console.log(`Fetched ${dealsWithDistance.length} deals from ${collectionName}`);
    
    // Convert to Singapore time for day/time validation
    const singaporeTime = getSingaporeTime();
    const currentDay = singaporeTime.getDay(); // 0-6, where 0 is Sunday
    
    // Get the current time in minutes since midnight (e.g., 8:30am = 510 minutes)
    const hours = singaporeTime.getHours();
    const minutes = singaporeTime.getMinutes();
    const currentTimeValue = hours * 60 + minutes;
    
    // Get the current day of the week in the format used in the valid_days field
    const dayMap = {
      0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
    };
    const currentDayStr = dayMap[currentDay];
    
    // Process deals to add isActive property and format response
    const processedDeals = dealsWithDistance.map(deal => {
      const isForToday = deal.valid_days.includes(currentDayStr) || 
                        (deal.valid_days.includes('Everyday')) ||
                        (deal.valid_days.includes('Weekdays') && currentDay >= 1 && currentDay <= 5);
      
      // Convert time strings (HH:MM) to minutes since midnight
      const startTimeParts = deal.hh_start_time.split(':').map(Number);
      const endTimeParts = deal.hh_end_time.split(':').map(Number);
      
      const startTimeValue = startTimeParts[0] * 60 + startTimeParts[1];
      const endTimeValue = endTimeParts[0] * 60 + endTimeParts[1];
      
      // Determine if the deal is active based on the current time
      let isWithinTimeWindow = false;
      
      // Normal case (start time before end time, e.g., 16:00-20:00)
      if (startTimeValue <= endTimeValue) {
        isWithinTimeWindow = currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
      } 
      // Special case for deals that run overnight (e.g., 22:00-02:00)
      else {
        isWithinTimeWindow = currentTimeValue >= startTimeValue || currentTimeValue <= endTimeValue;
      }
      
      // Deal is active if it's for today and within the time window
      const isActive = isForToday && isWithinTimeWindow;
      
      // Format the establishment data embedded in the deal
      const establishment = {
        id: deal.establishmentId,
        name: deal.establishmentName,
        address: deal.establishmentAddress,
        city: deal.establishmentCity,
        postalCode: deal.establishmentPostalCode,
        latitude: deal.establishmentLat,
        longitude: deal.establishmentLng,
        lat: deal.establishmentLat, // Add lat/lng aliases to match frontend expectations
        lng: deal.establishmentLng,
        cuisine: deal.establishmentCuisine,
        rating: deal.establishmentRating,
        imageUrl: deal.establishmentImageUrl
      };
      
      // Add the isActive property and establishment info to the deal object
      return { 
        id: deal.id,
        establishmentId: deal.establishmentId,
        alcohol_category: deal.alcohol_category,
        alcohol_subcategory: deal.alcohol_subcategory,
        alcohol_subcategory2: deal.alcohol_subcategory2,
        drink_name: deal.drink_name,
        standard_price: deal.standard_price,
        happy_hour_price: deal.happy_hour_price,
        savings: deal.savings,
        savingsPercentage: deal.savingsPercentage,
        valid_days: deal.valid_days,
        hh_start_time: deal.hh_start_time,
        hh_end_time: deal.hh_end_time,
        collections: deal.collections,
        description: deal.description,
        sort_order: deal.sort_order,
        imageUrl: deal.imageUrl,
        imageId: deal.imageId,
        cloudflareImageId: deal.cloudflareImageId,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
        isActive,
        establishment,
        distance: deal.distance
      };
    });
    
    // If this is near the boundary, log it for debugging
    processedDeals.forEach(deal => {
      if (deal.distance && Math.abs(deal.distance - radius) < 0.5) {
        console.log(`Establishment ${deal.establishment.name} is near radius boundary: ${deal.distance.toFixed(2)} km (radius: ${radius} km)`);
      }
    });
    
    res.json(processedDeals);
  } catch (error) {
    console.error(`Error fetching deals for collection ${req.params.collectionSlug}:`, error);
    res.status(500).json({
      error: 'Failed to fetch deals',
      message: 'There was an error retrieving the deals. Please try again later.',
      details: error.message
    });
  }
});

// 4. Get all collections
app.get('/api/collections', async (req, res) => {
  try {
    console.log('Getting all collections...');
    const result = await pool.query(`
      SELECT 
        id, 
        slug, 
        name, 
        description, 
        priority, 
        icon, 
        active,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM collections
      WHERE active = true
      ORDER BY priority ASC
    `);
    
    console.log(`Returning collections sorted by priority: [${result.rows.map(c => `'${c.name} (priority: ${c.priority})'`).join(', ')}]`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({
      error: 'Failed to fetch collections',
      message: 'There was an error retrieving the collections. Please try again later.',
      details: error.message
    });
  }
});

// 5. Get all locations
app.get('/api/locations/all', async (req, res) => {
  try {
    console.log('Location API request:', {
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: req.headers
    });
    
    const result = await pool.query(`
      SELECT * FROM singapore_locations
      ORDER BY is_popular DESC, name ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      error: 'Failed to fetch locations',
      message: 'There was an error retrieving the locations. Please try again later.',
      details: error.message
    });
  }
});

// 6. User endpoint for session information
app.get('/api/user', (req, res) => {
  console.log('GET /api/user - Session info:', {
    sessionID: req?.session?.id || 'no-session',
    authenticated: !!req?.session?.user,
    user: req?.session?.user || null
  });
  
  // If no user is authenticated, return 401
  if (!req?.session?.user) {
    console.log('User not authenticated, returning 401');
    return res.status(401).json({ 
      authenticated: false,
      message: 'Not authenticated' 
    });
  }
  
  // Return user data if authenticated
  res.json({ 
    authenticated: true,
    user: req.session.user
  });
});

// Try to serve static files from possible build directories
const clientPaths = [
  'dist/client',
  'client/dist',
  'dist',
  'client',
  'public'
];

// Find the first valid client path that exists
let clientPath = clientPaths.find(path => {
  try {
    return fs.existsSync(path) && fs.statSync(path).isDirectory();
  } catch (error) {
    return false;
  }
});

if (clientPath) {
  console.log(`✅ Found client files in ${clientPath}, serving static files from this directory`);
  app.use(express.static(clientPath));
  
  // Serve index.html for any client-side routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) return res.status(404).send('API endpoint not found');
    
    // Try to serve index.html for client routes
    const indexPath = path.join(clientPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      console.log(`Serving index.html for client route: ${req.path}`);
      res.sendFile(path.resolve(indexPath));
    } else {
      // If we can't find index.html, serve a basic HTML page
      res.send(`<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Buzzd - Singapore Happy Hour Deals</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 2rem;
            text-align: center;
            line-height: 1.6;
          }
          h1 { color: #E63946; }
          p { color: #444; }
          .logo { 
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          .card {
            border: 1px solid #ddd;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
          }
          a {
            color: #E63946;
            text-decoration: none;
          }
          .cta {
            background: #E63946;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            display: inline-block;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="logo">🍹 Buzzd</div>
        <h1>Singapore's Happy Hour Deals</h1>
        <p>Discover the best happy hour deals around you in Singapore!</p>
        
        <div class="card">
          <p>Looking for the best deals on drinks? Buzzd helps you find happy hour offers near you.</p>
          <a href="/restaurants" class="cta">Find Deals</a>
        </div>
        
        <p>Find great deals on:</p>
        
        <div style="display: flex; justify-content: space-between; margin: 2rem 0;">
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 2rem;">🍺</div>
            <div>Beer</div>
          </div>
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 2rem;">🍷</div>
            <div>Wine</div>
          </div>
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 2rem;">🍸</div>
            <div>Cocktails</div>
          </div>
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 2rem;">🥃</div>
            <div>Spirits</div>
          </div>
        </div>
        
        <p>© Buzzd 2025</p>
      </body>
      </html>`);
    }
  });
} else {
  console.log('⚠️ No client files found, serving API endpoints only');
  
  // Serve a simple landing page at the root
  app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Buzzd API Server</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
          line-height: 1.6;
        }
        h1 { color: #E63946; }
        p { color: #444; }
        .endpoint {
          background: #f4f4f8;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-family: monospace;
          margin-bottom: 0.5rem;
        }
      </style>
    </head>
    <body>
      <h1>🍹 Buzzd API Server</h1>
      <p>This is the API server for Buzzd Happy Hour Deals. The following endpoints are available:</p>
      
      <h2>Establishments</h2>
      <div class="endpoint">GET /api/establishments</div>
      <p>Get all establishments (restaurants, bars) with their basic info.</p>
      
      <div class="endpoint">GET /api/establishments/:id</div>
      <p>Get details for a specific establishment including its deals.</p>
      
      <h2>Deals</h2>
      <div class="endpoint">GET /api/deals/collections/:collectionSlug</div>
      <p>Get deals for a specific collection. Use with query params: ?lat=1.3521&lng=103.8198&radius=5</p>
      
      <h2>Collections</h2>
      <div class="endpoint">GET /api/collections</div>
      <p>Get all deal collections.</p>
      
      <h2>User</h2>
      <div class="endpoint">GET /api/user</div>
      <p>Get user session information if authenticated.</p>
      
      <p><small>Server started at: ${new Date().toISOString()}</small></p>
    </body>
    </html>`);
  });
}

// Test endpoint to verify server is running
app.get('/api/healthcheck', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    singaporeTime: getSingaporeTime().toISOString(),
    environment: process.env.NODE_ENV,
    databaseConnected: !!pool
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Unified server running on port ${PORT}`);
});