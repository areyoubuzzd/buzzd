/**
 * Fixed Production Server for Buzzd App
 * Uses correct column names for the production database
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Add middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(`
=================================================
  BUZZD FIXED PRODUCTION SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}
Current Directory: ${process.cwd()}
=================================================
`);

// Check for built React app in various locations
const possibleClientPaths = [
  'dist/public',
  'client/dist',
  'dist',
  'client',
  'public'
];

let clientPath = '';
for (const path of possibleClientPaths) {
  if (fs.existsSync(path)) {
    try {
      const stats = fs.statSync(path);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(path);
        if (files.includes('index.html') || files.includes('assets')) {
          clientPath = path;
          console.log(`✅ Found client files at: ${path}`);
          console.log(`Files in ${path}:`, files.join(', '));
          break;
        }
      }
    } catch (err) {
      console.error(`Error checking path ${path}:`, err);
    }
  }
}

// If we found a client path, serve those static files
if (clientPath) {
  app.use(express.static(clientPath));
  console.log(`Serving static files from ${clientPath}`);
}

// Serve additional assets from other directories
const additionalAssetDirs = [
  'dist/client',
  'public',
  'public/assets',
  'public/images',
  'assets'
];

additionalAssetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    app.use('/' + path.basename(dir), express.static(dir));
    console.log(`Serving additional assets from ${dir}`);
  }
});

// Connect to database for direct API handling
let pool = null;
if (process.env.DATABASE_URL) {
  try {
    console.log('Connecting to database...');
    
    // Configure NeonDB for WebSocket connections
    const { neonConfig } = require('@neondatabase/serverless');
    neonConfig.webSocketConstructor = ws;
    
    // Create a connection pool
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
} else {
  console.error('DATABASE_URL environment variable not set');
}

// ============ LOCATIONS API ROUTES =================

// Get all locations (neighborhoods)
app.get('/api/locations', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    console.log('API: Getting locations');
    
    // Get all unique neighborhoods from establishments
    const { rows } = await pool.query(`
      SELECT DISTINCT neighbourhood 
      FROM establishments 
      WHERE neighbourhood IS NOT NULL AND neighbourhood != ''
      ORDER BY neighbourhood ASC
    `);
    
    // Format to return just the location names
    const locations = rows.map(row => row.neighbourhood);
    
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch locations', 
      message: 'There was an error retrieving locations. Please try again later.',
      details: error.message
    });
  }
});

// Get establishments by location
app.get('/api/establishments/location/:location', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    const { location } = req.params;
    console.log(`API: Getting establishments in location ${location}`);
    
    // Get establishments in the specified location
    const { rows } = await pool.query(
      `SELECT 
        id,
        name,
        address,
        latitude,
        longitude,
        neighbourhood,
        has_active_deals as "hasActiveDeals",
        logo_url as "logoUrl",
        image_url as "imageUrl",
        cloudflare_image_id as "cloudflareImageId",
        external_id as "externalId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM establishments 
      WHERE neighbourhood = $1`,
      [location]
    );
    
    // Transform to expected format
    const formattedRows = rows.map(row => ({
      ...row,
      lat: row.latitude,
      lng: row.longitude
    }));
    
    res.json(formattedRows);
  } catch (error) {
    console.error(`Error fetching establishments in location ${req.params.location}:`, error);
    res.status(500).json({
      error: 'Failed to fetch establishments by location',
      message: 'There was an error retrieving the establishments. Please try again later.',
      details: error.message
    });
  }
});

// ============ ESTABLISHMENT API ROUTES =================

// Get all establishments
app.get('/api/establishments', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    console.log('API: Getting establishments');
    
    // Use a basic query without joins to avoid errors
    const { rows } = await pool.query(`
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
    
    // Transform to expected format
    const formattedRows = rows.map(row => ({
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

// Get a specific establishment with its deals
app.get('/api/establishments/:establishmentId', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    const { establishmentId } = req.params;
    console.log(`API: Getting establishment ${establishmentId}`);
    
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
    
    // Format the establishment data
    const formattedEstablishment = {
      ...establishment,
      deals: dealRows
    };
    
    res.json(formattedEstablishment);
  } catch (error) {
    console.error(`Error fetching establishment ${req.params.establishmentId}:`, error);
    res.status(500).json({
      error: 'Failed to fetch establishment',
      message: 'There was an error retrieving the establishment. Please try again later.',
      details: error.message
    });
  }
});

// Get deals for a specific establishment (needed for some UIs)
app.get('/api/establishments/:establishmentId/deals', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    const { establishmentId } = req.params;
    console.log(`API: Getting deals for establishment ${establishmentId}`);
    
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
    
    // Get the establishment info
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
        external_id as "externalId"
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
    
    // Format deals with establishment info
    const deals = dealRows.map(deal => ({
      ...deal,
      establishment
    }));
    
    res.json(deals);
  } catch (error) {
    console.error(`Error fetching deals for establishment ${req.params.establishmentId}:`, error);
    res.status(500).json({
      error: 'Failed to fetch establishment deals',
      message: 'There was an error retrieving the deals. Please try again later.',
      details: error.message
    });
  }
});

// ============ DEALS API ROUTES =================

// Get deals for a collection 
app.get('/api/deals/collections/:collectionSlug', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    const { collectionSlug } = req.params;
    
    console.log(`API: Getting deals for collection ${collectionSlug}`);
    
    // Get basic deal info
    const { rows: dealRows } = await pool.query(`
      SELECT * FROM deals
    `);
    
    // Get basic establishment info
    const { rows: establishmentRows } = await pool.query(`
      SELECT * FROM establishments
    `);
    
    // Create a map of establishment IDs to establishments
    const establishmentMap = {};
    establishmentRows.forEach(est => {
      establishmentMap[est.id] = {
        id: est.id,
        name: est.name,
        address: est.address,
        city: est.city,
        postalCode: est.postal_code,
        lat: est.latitude,
        lng: est.longitude,
        latitude: est.latitude,
        longitude: est.longitude,
        cuisine: est.cuisine,
        rating: est.rating,
        price: est.price,
        priority: est.priority,
        imageUrl: est.image_url,
        imageId: est.image_id,
        externalId: est.external_id
      };
    });
    
    // Transform the deals data to add establishment information
    const deals = dealRows.map(deal => {
      const establishment = establishmentMap[deal.establishment_id] || { 
        id: deal.establishment_id,
        name: 'Unknown Restaurant'
      };
      
      return {
        id: deal.id,
        establishmentId: deal.establishment_id,
        alcohol_category: deal.alcohol_category,
        alcohol_subcategory: deal.alcohol_subcategory,
        alcohol_subcategory2: deal.alcohol_subcategory2,
        drink_name: deal.drink_name,
        standard_price: deal.standard_price,
        happy_hour_price: deal.happy_hour_price,
        savings: deal.savings,
        savings_percentage: deal.savings_percentage,
        valid_days: deal.valid_days,
        hh_start_time: deal.hh_start_time,
        hh_end_time: deal.hh_end_time,
        collections: deal.collections,
        description: deal.description,
        sort_order: deal.sort_order,
        imageUrl: deal.image_url,
        imageId: deal.image_id,
        cloudflareImageId: deal.cloudflare_image_id,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
        isActive: false, // We'll calculate this in the UI
        establishment: establishment
      };
    });
    
    // If a collection is specified, filter the deals
    let filteredDeals = deals;
    if (collectionSlug !== 'all') {
      filteredDeals = deals.filter(deal => {
        const dealCollections = (deal.collections || '').split(',').map(c => c.trim());
        return dealCollections.includes(collectionSlug);
      });
    }
    
    // Apply distance filter if location is provided
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 5; // radius in km
    
    if (!isNaN(lat) && !isNaN(lng)) {
      console.log(`Filtering by location: ${lat}, ${lng}, radius: ${radius}km`);
      
      // Function to calculate distance between two coordinates
      function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c; // Distance in km
        return d;
      }
      
      function deg2rad(deg) {
        return deg * (Math.PI/180);
      }
      
      // Filter deals by distance
      filteredDeals = filteredDeals.filter(deal => {
        const { establishment } = deal;
        if (!establishment || !establishment.lat || !establishment.lng) return false;
        
        const estLat = parseFloat(establishment.lat);
        const estLng = parseFloat(establishment.lng);
        
        if (isNaN(estLat) || isNaN(estLng)) return false;
        
        const distance = getDistance(lat, lng, estLat, estLng);
        deal.distance = distance;
        
        return distance <= radius;
      });
    }
    
    res.json(filteredDeals);
  } catch (error) {
    console.error(`Error fetching deals for collection ${req.params.collectionSlug}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch deals', 
      message: 'There was an error retrieving the deals. Please try again later.',
      details: error.message
    });
  }
});

// Get nearby deals
app.get('/api/deals/nearby', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    // Get user location from query params, or use defaults (central Singapore)
    const lat = parseFloat(req.query.lat) || 1.3521;
    const lng = parseFloat(req.query.lng) || 103.8198;
    const radius = parseFloat(req.query.radius) || 10; // radius in km
    
    console.log(`API: Getting nearby deals at coordinates ${lat}, ${lng} within ${radius}km`);
    
    // Get all establishments and calculate distance
    const { rows: establishments } = await pool.query(`
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
        external_id as "externalId"
      FROM establishments
    `);
    
    // Function to calculate distance between two coordinates
    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
      const R = 6371; // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const d = R * c; // Distance in km
      return d;
    }
    
    function deg2rad(deg) {
      return deg * (Math.PI/180);
    }
    
    // Calculate distance for each establishment and filter by radius
    const nearbyEstablishments = establishments
      .map(est => {
        if (!est.latitude || !est.longitude) return null;
        
        const distance = getDistanceFromLatLonInKm(
          lat, lng, 
          parseFloat(est.latitude), parseFloat(est.longitude)
        );
        
        // Add lat/lng properties expected by the frontend
        return { 
          ...est,
          lat: est.latitude,
          lng: est.longitude,
          distance 
        };
      })
      .filter(est => est && est.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
    
    // Get all establishments IDs
    const establishmentIds = nearbyEstablishments.map(est => est.id);
    
    if (establishmentIds.length === 0) {
      return res.json([]);
    }
    
    // Get deals for these establishments
    const { rows: dealRows } = await pool.query(`
      SELECT 
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
      WHERE establishment_id = ANY($1::int[])
    `, [establishmentIds]);
    
    // Create a map of establishment IDs to establishments with distance
    const establishmentMap = {};
    nearbyEstablishments.forEach(est => {
      establishmentMap[est.id] = est;
    });
    
    // Format deals with establishment info
    const nearbyDeals = dealRows.map(deal => {
      const establishment = establishmentMap[deal.establishmentId] || {
        id: deal.establishmentId,
        name: 'Unknown Restaurant',
        distance: 999
      };
      
      return {
        ...deal,
        distance: establishment.distance,
        establishment
      };
    });
    
    res.json(nearbyDeals);
  } catch (error) {
    console.error('Error fetching nearby deals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch nearby deals', 
      message: 'There was an error retrieving the nearby deals. Please try again later.',
      details: error.message
    });
  }
});

// ============ COLLECTIONS API ROUTES =================

app.get('/api/collections', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    console.log('API: Getting collections');
    const { rows } = await pool.query('SELECT * FROM collections WHERE active = TRUE ORDER BY priority ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ 
      error: 'Failed to fetch collections', 
      message: 'There was an error retrieving the collections. Please try again later.',
      details: error.message
    });
  }
});

// ============ AUTHENTICATION API ROUTES =================

app.get('/api/user', (req, res) => {
  // Since we don't have full authentication in this direct handler,
  // just return a 401 to indicate the user is not logged in
  res.status(401).end();
});

// Add a diagnostic API test endpoint
app.get('/api-test', (req, res) => {
  res.json({
    status: 'API Test',
    environment: process.env.NODE_ENV,
    port: PORT,
    dbConnected: !!pool,
    clientPath,
    timestamp: new Date().toISOString()
  });
});

// For client-side routing - all routes serve index.html
app.get('*', (req, res) => {
  // If we have a client path and it has an index.html, serve that
  if (clientPath && fs.existsSync(path.join(clientPath, 'index.html'))) {
    return res.sendFile(path.resolve(path.join(clientPath, 'index.html')));
  }
  
  // Otherwise, serve a simple HTML
  res.send(`
    <html>
      <head><title>Buzzd</title></head>
      <body>
        <h1>Buzzd App</h1>
        <p>Server is running but no client files found.</p>
        <p>API Test: <a href="/api-test">/api-test</a></p>
      </body>
    </html>
  `);
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
=================================================
  SERVER STARTED
=================================================
Frontend & API: http://localhost:${PORT}
Database Connected: ${!!pool}
=================================================
`);
});