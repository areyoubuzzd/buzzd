/**
 * Simple Deployment Server for Buzzd App
 * This file is designed to be small and reliable
 */
const express = require('express');
const path = require('path');
const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');

// Create Express app
const app = express();
app.use(express.json());

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all collections
app.get('/api/collections', async (req, res) => {
  try {
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
    
    console.log(`Returning ${rows.length} collections`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Get all establishments
app.get('/api/establishments', async (req, res) => {
  try {
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
    
    // Transform to expected format with lat/lng for backwards compatibility
    const establishments = rows.map(est => ({
      ...est,
      lat: est.latitude,
      lng: est.longitude
    }));
    
    // Filter by location if provided
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 5; // km
    
    let filteredEstablishments = establishments;
    
    if (!isNaN(lat) && !isNaN(lng)) {
      console.log(`Filtering by location: ${lat}, ${lng}, radius: ${radius}km`);
      
      // Distance calculation function
      function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      }
      
      // Filter by distance
      filteredEstablishments = establishments.filter(est => {
        const estLat = parseFloat(est.latitude);
        const estLng = parseFloat(est.longitude);
        
        if (isNaN(estLat) || isNaN(estLng)) return false;
        
        const distance = getDistance(lat, lng, estLat, estLng);
        est.distance = distance;
        
        return distance <= radius;
      });
    }
    
    // Get deal counts for each establishment
    const { rows: deals } = await pool.query(
      `SELECT establishment_id, COUNT(*) as count
       FROM deals
       GROUP BY establishment_id`
    );
    
    // Create a map of establishment ID to deal count
    const dealCounts = {};
    deals.forEach(d => {
      dealCounts[d.establishment_id] = parseInt(d.count);
    });
    
    // Add deal counts to establishments
    filteredEstablishments = filteredEstablishments.map(est => ({
      ...est,
      dealsCount: dealCounts[est.id] || 0,
      hasActiveDeals: (dealCounts[est.id] || 0) > 0
    }));
    
    console.log(`Returning ${filteredEstablishments.length} establishments`);
    res.json(filteredEstablishments);
  } catch (error) {
    console.error('Error fetching establishments:', error);
    res.status(500).json({ error: 'Failed to fetch establishments' });
  }
});

// Get a specific establishment with its deals
app.get('/api/establishments/:establishmentId', async (req, res) => {
  try {
    const { establishmentId } = req.params;
    console.log(`Getting establishment ${establishmentId}`);
    
    // Validate input
    if (!establishmentId || isNaN(parseInt(establishmentId))) {
      return res.status(400).json({ error: 'Invalid establishment ID' });
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
    
    // Add lat/lng for backwards compatibility
    establishment.lat = establishment.latitude;
    establishment.lng = establishment.longitude;
    
    // Get deals for this establishment
    const { rows: deals } = await pool.query(
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
    
    // Format the response as expected by the client
    const response = {
      establishment: establishment,
      activeDeals: deals
    };
    
    console.log(`Returning establishment ${establishment.name} with ${deals.length} deals`);
    res.json(response);
  } catch (error) {
    console.error(`Error fetching establishment ${req.params.establishmentId}:`, error);
    res.status(500).json({ error: 'Failed to fetch establishment' });
  }
});

// Get deals for a specific establishment
app.get('/api/establishments/:establishmentId/deals', async (req, res) => {
  try {
    const { establishmentId } = req.params;
    console.log(`Getting deals for establishment ${establishmentId}`);
    
    // Get deals
    const { rows: deals } = await pool.query(
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
    
    // Get establishment info
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
    establishment.lat = establishment.latitude;
    establishment.lng = establishment.longitude;
    
    // Include establishment info with each deal
    const dealsWithEstablishment = deals.map(deal => ({
      ...deal,
      establishment
    }));
    
    res.json(dealsWithEstablishment);
  } catch (error) {
    console.error(`Error fetching deals for establishment ${req.params.establishmentId}:`, error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Get deals for a collection
app.get('/api/deals/collections/:collectionSlug', async (req, res) => {
  try {
    const { collectionSlug } = req.params;
    console.log(`Getting deals for collection ${collectionSlug}`);
    
    // Get all deals
    const { rows: dealRows } = await pool.query(`SELECT * FROM deals`);
    
    // Get all establishments
    const { rows: establishmentRows } = await pool.query(`SELECT * FROM establishments`);
    
    // Create establishment lookup map
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
    
    // Add establishment info to deals
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
        savingsPercentage: deal.savings_percentage,
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
        isActive: false, // Calculated on client
        establishment: establishment
      };
    });
    
    // Filter by collection if not "all"
    let filteredDeals = deals;
    if (collectionSlug !== 'all') {
      filteredDeals = deals.filter(deal => {
        const dealCollections = (deal.collections || '').split(',').map(c => c.trim());
        return dealCollections.includes(collectionSlug);
      });
    }
    
    // Filter by location if provided
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 5; // km
    
    if (!isNaN(lat) && !isNaN(lng)) {
      console.log(`Filtering by location: ${lat}, ${lng}, radius: ${radius}km`);
      
      // Distance calculation function
      function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      }
      
      // Filter by distance
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
    
    console.log(`Returning ${filteredDeals.length} deals for collection ${collectionSlug}`);
    res.json(filteredDeals);
  } catch (error) {
    console.error(`Error fetching deals for collection ${req.params.collectionSlug}:`, error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// User endpoint (returns 401 as we don't have auth)
app.get('/api/user', (req, res) => {
  res.status(401).json({ authenticated: false });
});

// Nearby deals
app.get('/api/deals/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 1.3521;
    const lng = parseFloat(req.query.lng) || 103.8198;
    const radius = parseFloat(req.query.radius) || 10; // km
    
    console.log(`Getting nearby deals at ${lat}, ${lng} within ${radius}km`);
    
    // Get all establishments
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
    
    // Distance calculation function
    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
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
    
    // Get deals for nearby establishments
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
    
    // Create establishment lookup map
    const establishmentMap = {};
    nearbyEstablishments.forEach(est => {
      establishmentMap[est.id] = est;
    });
    
    // Add establishment info to deals
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
    
    console.log(`Returning ${dealsWithEstablishments.length} nearby deals`);
    res.json(dealsWithEstablishments);
  } catch (error) {
    console.error('Error fetching nearby deals:', error);
    res.status(500).json({ error: 'Failed to fetch nearby deals' });
  }
});

// Serve a simple HTML page for the root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Buzzd API Server</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
        }
        h1 {
          color: #ff4500;
        }
        .endpoint {
          background: #f5f5f5;
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 4px;
        }
        .method {
          display: inline-block;
          padding: 2px 6px;
          background: #e0e0e0;
          border-radius: 4px;
          margin-right: 5px;
          font-weight: bold;
        }
        .get { background: #61affe; color: white; }
      </style>
    </head>
    <body>
      <h1>Buzzd API Server</h1>
      <p>This is a simplified API server for the Buzzd app, providing access to happy hour deals and establishment data.</p>
      
      <h2>Available API Endpoints:</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/health</code> - Health check endpoint
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/collections</code> - Get all deal collections
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/establishments</code> - Get all establishments (can filter by lat, lng, radius)
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/establishments/:id</code> - Get details for a specific establishment with its deals
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/establishments/:id/deals</code> - Get deals for a specific establishment
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/deals/collections/:slug</code> - Get deals in a specific collection
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span>
        <code>/api/deals/nearby</code> - Get deals near a location (specify lat, lng, radius)
      </div>
      
      <h3>Example:</h3>
      <p>
        <a href="/api/establishments?lat=1.3521&lng=103.8198&radius=5" target="_blank">
          /api/establishments?lat=1.3521&lng=103.8198&radius=5
        </a>
        - Get establishments within 5km of central Singapore
      </p>

      <p>
        <em>API is serving live data from the database.</em>
      </p>
    </body>
    </html>
  `);
});

// Catch-all route to serve the simple HTML
app.get('*', (req, res) => {
  res.redirect('/');
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Buzzd API server running on http://0.0.0.0:${port}`);
});