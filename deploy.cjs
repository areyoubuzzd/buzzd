/**
 * Production deployment server for Buzzd App
 * This server builds the client and then serves both the API and static files
 */
const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');

// Create an Express application
const app = express();

// Set up static file serving
const clientDistPath = path.resolve(__dirname, 'client', 'dist');

// Create the direct-serve index.html for production
function setupProduction() {
  try {
    console.log('Setting up production environment...');
    
    // Check if we need to build the client
    if (!fs.existsSync(clientDistPath) || !fs.existsSync(path.join(clientDistPath, 'index.html'))) {
      console.log('Client build not found, building client...');
      execSync('npm run build', { stdio: 'inherit' });
      console.log('Client build completed successfully');
    } else {
      console.log('Client build already exists, skipping build step');
    }
  } catch (error) {
    console.error('Error setting up production:', error);
    process.exit(1);
  }
}

// Run the production setup
setupProduction();

// Setup static file serving from dist
app.use(express.static(clientDistPath));
app.use('/images', express.static(path.resolve(__dirname, 'public', 'images')));

// Set up JSON parsing for API requests
app.use(express.json());

// Setup database connection
const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

if (!pool) {
  console.warn('Database connection not available. Some features will be limited.');
}

// ============ CORS and Security Middleware =================

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// ============ API ROUTES =================

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get list of all collections
app.get('/api/collections', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    // Get collections from database
    const { rows } = await pool.query(
      `SELECT 
        id, 
        slug, 
        name, 
        description, 
        priority, 
        image_url as "imageUrl", 
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM collections
      WHERE is_active = true
      ORDER BY priority ASC`
    );
    
    console.log(`Returning collections sorted by priority: ${rows.map(c => `'${c.name} (priority: ${c.priority})'`).join(', ')}`);
    
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

// Get all establishments (with optional filtering)
app.get('/api/establishments', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    // Get establishments from database
    const { rows } = await pool.query(
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
      ORDER BY priority DESC, name ASC`
    );
    
    // Transform to expected format for client
    const establishments = rows.map(est => ({
      ...est,
      lat: est.latitude, // Add these for backwards compatibility
      lng: est.longitude // Add these for backwards compatibility
    }));
    
    // Apply location filtering if provided
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 5; // radius in km
    
    let filteredEstablishments = establishments;
    
    if (!isNaN(lat) && !isNaN(lng)) {
      const urlParameters = req.originalUrl.slice(req.originalUrl.indexOf('?'));
      console.log(`Location parameters received: {
        lat: '${req.query.lat}',
        parsedLat: ${lat},
        lng: '${req.query.lng}',
        parsedLng: ${lng},
        radius: ${radius},
        urlParameters: '${req.originalUrl}'
      }`);
      
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
      
      // Filter establishments by distance
      filteredEstablishments = establishments.filter(est => {
        const estLat = parseFloat(est.latitude);
        const estLng = parseFloat(est.longitude);
        
        if (isNaN(estLat) || isNaN(estLng)) return false;
        
        const distance = getDistance(lat, lng, estLat, estLng);
        est.distance = distance;
        
        // If near the boundary, log it
        if (distance > radius * 0.9 && distance <= radius * 1.1) {
          console.log(`Establishment ${est.name} is near radius boundary: ${distance.toFixed(2)} km (radius: ${radius} km)`);
        }
        
        return distance <= radius;
      });
    }
    
    // Now get active deals for each establishment to show deal counts
    const { rows: allDeals } = await pool.query(
      `SELECT 
        id, 
        establishment_id as "establishmentId",
        alcohol_category,
        valid_days,
        hh_start_time,
        hh_end_time
      FROM deals`
    );
    
    console.log(`Fetched ${allDeals.length} deals from database`);
    
    // Create a map of establishment IDs to deals
    const establishmentDeals = {};
    allDeals.forEach(deal => {
      if (!establishmentDeals[deal.establishmentId]) {
        establishmentDeals[deal.establishmentId] = [];
      }
      establishmentDeals[deal.establishmentId].push(deal);
    });
    
    // Add deal counts to each establishment
    filteredEstablishments = filteredEstablishments.map(est => {
      const deals = establishmentDeals[est.id] || [];
      return {
        ...est,
        dealsCount: deals.length,
        hasActiveDeals: deals.length > 0
      };
    });
    
    res.json(filteredEstablishments);
  } catch (error) {
    console.error('Error fetching establishments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch establishments', 
      message: 'There was an error retrieving the establishments. Please try again later.',
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
    
    // Format the establishment data as expected by the client-side interface
    const formattedResponse = {
      establishment: establishment,
      activeDeals: dealRows
    };
    
    console.log('Restaurant details endpoint returned:', JSON.stringify({
      id: establishment.id,
      name: establishment.name,
      responseFormat: 'Checking response format',
      hasEstablishment: !!establishment,
      dealsCount: dealRows.length
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
    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1); 
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const d = R * c; // Distance in km
      return d;
    }
    
    function deg2rad(deg) {
      return deg * (Math.PI/180);
    }
    
    // Calculate distances and filter by radius
    const nearbyEstablishments = establishments
      .map(est => {
        const estLat = parseFloat(est.latitude);
        const estLng = parseFloat(est.longitude);
        
        if (isNaN(estLat) || isNaN(estLng)) return null;
        
        const distance = getDistance(lat, lng, estLat, estLng);
        return {
          ...est,
          lat: est.latitude,
          lng: est.longitude,
          distance
        };
      })
      .filter(est => est !== null && est.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
    
    // Get IDs of nearby establishments
    const nearbyEstablishmentIds = nearbyEstablishments.map(est => est.id);
    
    // If no nearby establishments, return empty array
    if (nearbyEstablishmentIds.length === 0) {
      return res.json([]);
    }
    
    // Get deals for these establishments
    const { rows: deals } = await pool.query(`
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
      WHERE establishment_id = ANY($1)
    `, [nearbyEstablishmentIds]);
    
    // Create a lookup map for establishments
    const establishmentMap = {};
    nearbyEstablishments.forEach(est => {
      establishmentMap[est.id] = est;
    });
    
    // Add establishment info to each deal
    const dealsWithEstablishments = deals.map(deal => ({
      ...deal,
      establishment: establishmentMap[deal.establishmentId] || null,
      distance: establishmentMap[deal.establishmentId]?.distance || null
    }));
    
    // Sort by distance
    dealsWithEstablishments.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
    
    res.json(dealsWithEstablishments);
  } catch (error) {
    console.error('Error fetching nearby deals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch nearby deals', 
      message: 'There was an error retrieving nearby deals. Please try again later.',
      details: error.message
    });
  }
});

// ============ AUTHENTICATION ROUTES =================

// Dummy user endpoint
app.get('/api/user', (req, res) => {
  res.status(401).json({ authenticated: false });
});

// ============ CATCH-ALL FOR SPA =================

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// ============ SERVER STARTUP =================

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});