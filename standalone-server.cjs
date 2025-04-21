/**
 * Standalone server for Buzzd App deployment
 * This server doesn't rely on built client files
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');

// Create an Express application
const app = express();

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

// ============ CATCH-ALL ROUTE =================

// Simplified HTML with embedded scripts for the frontend
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buzzd - Happy Hour Deals</title>
  <style>
    /* Basic styles */
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
      color: #333;
    }
    header {
      background-color: #ff4500;
      color: white;
      padding: 1rem;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 1rem;
    }
    h1, h2, h3 {
      margin-top: 0;
    }
    a {
      color: #ff4500;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .btn {
      display: inline-block;
      background-color: #ff4500;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      text-decoration: none;
      margin-top: 1rem;
    }
    .btn:hover {
      background-color: #e63900;
      text-decoration: none;
    }
    .api-output {
      background-color: #f8f8f8;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1rem;
      margin-top: 1rem;
      overflow: auto;
      max-height: 300px;
    }
    .collection-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .collection-card {
      background-color: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .collection-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .restaurant-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    .restaurant-card {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .restaurant-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    .restaurant-image {
      width: 100%;
      height: 180px;
      background-color: #eee;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .restaurant-details {
      padding: 1rem;
    }
    .restaurant-name {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
    .restaurant-info {
      color: #666;
      margin-bottom: 0.5rem;
    }
    .deals-badge {
      display: inline-block;
      background-color: #ff4500;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      margin-left: 0.5rem;
    }
    .loading {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
    .error {
      background-color: #ffeaea;
      color: #d32f2f;
      padding: 1rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    .restaurant-detail {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .restaurant-header {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
    }
    .restaurant-main-image {
      width: 300px;
      height: 200px;
      background-color: #eee;
      border-radius: 8px;
      flex-shrink: 0;
    }
    .restaurant-header-details {
      flex-grow: 1;
    }
    .deals-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .deal-card {
      background-color: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .deal-name {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .deal-price {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .deal-regular-price {
      text-decoration: line-through;
      color: #888;
    }
    .deal-happy-hour-price {
      font-weight: bold;
      color: #ff4500;
    }
    .deal-savings {
      color: #388e3c;
      font-weight: bold;
    }
    .deal-time {
      color: #666;
      font-size: 0.9rem;
    }
    .active-deal {
      border: 2px solid #388e3c;
    }
    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      cursor: pointer;
    }
    @media (max-width: 768px) {
      .restaurant-header {
        flex-direction: column;
      }
      .restaurant-main-image {
        width: 100%;
      }
      .collection-list,
      .restaurant-list,
      .deals-list {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Buzzd</h1>
    <p>Discover the best happy hour deals nearby</p>
  </header>
  
  <main id="app">
    <div id="loading" class="loading">
      <p>Loading application...</p>
    </div>
  </main>

  <script>
    // Global state
    const state = {
      collections: [],
      establishments: [],
      selectedCollection: null,
      selectedEstablishment: null,
      selectedEstablishmentDeals: [],
      location: { lat: 1.3521, lng: 103.8198, radius: 5 },
      loading: false,
      error: null,
      page: 'home'
    };

    // Helper functions
    function formatCurrency(amount) {
      return '$' + parseFloat(amount).toFixed(2);
    }

    function formatPercentage(value) {
      return Math.round(value) + '%';
    }

    function formatTime(timeStr) {
      if (!timeStr) return '';
      
      let hours = 0;
      let minutes = 0;
      
      if (timeStr.includes(':')) {
        const parts = timeStr.split(':');
        hours = parseInt(parts[0]);
        minutes = parseInt(parts[1]);
      } else {
        // Handle format like "1700" or "900"
        if (timeStr.length <= 2) {
          // Just hours like "9" or "17"
          hours = parseInt(timeStr);
          minutes = 0;
        } else if (timeStr.length === 3) {
          // Format like "930" (9:30)
          hours = parseInt(timeStr.substring(0, 1));
          minutes = parseInt(timeStr.substring(1));
        } else {
          // Format like "0930" or "1700"
          hours = parseInt(timeStr.substring(0, 2));
          minutes = parseInt(timeStr.substring(2));
        }
      }
      
      // Format with AM/PM
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      
      return \`\${hours}:\${minutesStr} \${ampm}\`;
    }

    function isWithinHappyHour(deal) {
      if (!deal) return false;
      
      // Get the current date in the user's local timezone
      const currentDate = new Date();
      
      // Get the current day (0-6, where 0 is Sunday)
      const currentDay = currentDate.getDay();
      
      // Map our day number to day name
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDayName = dayNames[currentDay];
      
      // Check if the current day is in the valid days
      const validDays = deal.valid_days ? deal.valid_days.split(',').map(d => d.trim()) : [];
      if (!validDays.includes(currentDayName) && !validDays.includes('All')) {
        return false;
      }
      
      // Get the current time
      const currentHour = currentDate.getHours();
      const currentMinute = currentDate.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      // Parse start and end times
      let startHour = 0;
      let startMinute = 0;
      let startTimeStr = deal.hh_start_time;
      
      if (startTimeStr.includes(':')) {
        const parts = startTimeStr.split(':');
        startHour = parseInt(parts[0]);
        startMinute = parseInt(parts[1]);
      } else {
        // Handle format like "1700" or "900"
        if (startTimeStr.length <= 2) {
          startHour = parseInt(startTimeStr);
          startMinute = 0;
        } else if (startTimeStr.length === 3) {
          startHour = parseInt(startTimeStr.substring(0, 1));
          startMinute = parseInt(startTimeStr.substring(1));
        } else {
          startHour = parseInt(startTimeStr.substring(0, 2));
          startMinute = parseInt(startTimeStr.substring(2));
        }
      }
      
      let endHour = 0;
      let endMinute = 0;
      let endTimeStr = deal.hh_end_time;
      
      if (endTimeStr.includes(':')) {
        const parts = endTimeStr.split(':');
        endHour = parseInt(parts[0]);
        endMinute = parseInt(parts[1]);
      } else {
        // Handle format like "1700" or "900"
        if (endTimeStr.length <= 2) {
          endHour = parseInt(endTimeStr);
          endMinute = 0;
        } else if (endTimeStr.length === 3) {
          endHour = parseInt(endTimeStr.substring(0, 1));
          endMinute = parseInt(endTimeStr.substring(1));
        } else {
          endHour = parseInt(endTimeStr.substring(0, 2));
          endMinute = parseInt(endTimeStr.substring(2));
        }
      }
      
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;
      
      // Check if the current time is within the happy hour time range
      if (endTimeMinutes > startTimeMinutes) {
        // Normal case: start time is before end time on the same day
        return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
      } else {
        // Edge case: end time is on the next day (e.g., 10:00 PM to 2:00 AM)
        return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
      }
    }

    // API functions
    async function fetchCollections() {
      state.loading = true;
      state.error = null;
      renderApp();
      
      try {
        const response = await fetch('/api/collections');
        if (!response.ok) {
          throw new Error('Failed to fetch collections');
        }
        const data = await response.json();
        state.collections = data;
      } catch (error) {
        console.error('Error fetching collections:', error);
        state.error = 'Failed to load collections. Please try again later.';
      } finally {
        state.loading = false;
        renderApp();
      }
    }

    async function fetchEstablishments() {
      state.loading = true;
      state.error = null;
      renderApp();
      
      try {
        const { lat, lng, radius } = state.location;
        const response = await fetch(\`/api/establishments?lat=\${lat}&lng=\${lng}&radius=\${radius}\`);
        if (!response.ok) {
          throw new Error('Failed to fetch establishments');
        }
        const data = await response.json();
        state.establishments = data;
      } catch (error) {
        console.error('Error fetching establishments:', error);
        state.error = 'Failed to load restaurants. Please try again later.';
      } finally {
        state.loading = false;
        renderApp();
      }
    }

    async function fetchEstablishmentDetails(id) {
      state.loading = true;
      state.error = null;
      renderApp();
      
      try {
        const response = await fetch(\`/api/establishments/\${id}\`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Restaurant not found');
          } else if (response.status === 400) {
            throw new Error('Invalid restaurant ID');
          } else {
            throw new Error('Failed to fetch restaurant details');
          }
        }
        const data = await response.json();
        state.selectedEstablishment = data.establishment;
        state.selectedEstablishmentDeals = data.activeDeals;
      } catch (error) {
        console.error('Error fetching establishment details:', error);
        state.error = error.message || 'Failed to load restaurant details. Please try again later.';
      } finally {
        state.loading = false;
        renderApp();
      }
    }

    // Navigation functions
    function navigateToHome() {
      state.page = 'home';
      state.selectedCollection = null;
      state.selectedEstablishment = null;
      state.selectedEstablishmentDeals = [];
      state.error = null;
      fetchCollections();
      fetchEstablishments();
    }

    function navigateToEstablishment(id) {
      state.page = 'establishment';
      state.error = null;
      fetchEstablishmentDetails(id);
    }

    // Rendering functions
    function renderHome() {
      return \`
        <div class="container">
          <h2>Explore Happy Hour Deals</h2>
          
          <div id="collections-section">
            <h3>Popular Collections</h3>
            ${renderCollectionsList()}
          </div>

          <div id="restaurants-section">
            <h3>Nearby Restaurants & Bars</h3>
            ${renderEstablishmentsList()}
          </div>
        </div>
      \`;
    }

    function renderCollectionsList() {
      if (state.loading && state.collections.length === 0) {
        return '<div class="loading">Loading collections...</div>';
      }
      
      if (state.error && state.collections.length === 0) {
        return \`<div class="error">\${state.error}</div>\`;
      }
      
      if (state.collections.length === 0) {
        return '<div>No collections found.</div>';
      }
      
      return \`
        <div class="collection-list">
          ${state.collections.map(collection => `
            <div class="collection-card" onclick="alert('Collection view not implemented in this simplified version')">
              <h4>\${collection.name}</h4>
              <p>\${collection.description || 'Explore this collection of happy hour deals'}</p>
            </div>
          \`).join('')}
        </div>
      \`;
    }

    function renderEstablishmentsList() {
      if (state.loading && state.establishments.length === 0) {
        return '<div class="loading">Loading restaurants...</div>';
      }
      
      if (state.error && state.establishments.length === 0) {
        return \`<div class="error">\${state.error}</div>\`;
      }
      
      if (state.establishments.length === 0) {
        return '<div>No restaurants found in your area.</div>';
      }
      
      return \`
        <div class="restaurant-list">
          ${state.establishments.map(establishment => \`
            <div class="restaurant-card" onclick="navigateToEstablishment(\${establishment.id})">
              <div class="restaurant-image">
                ${establishment.imageUrl 
                  ? \`<img src="\${establishment.imageUrl}" alt="\${establishment.name}" style="width: 100%; height: 100%; object-fit: cover;">\`
                  : \`<span>\${establishment.name.charAt(0)}\${establishment.name.split(' ')[1]?.charAt(0) || ''}</span>\`
                }
              </div>
              <div class="restaurant-details">
                <h3 class="restaurant-name">
                  \${establishment.name}
                  ${establishment.hasActiveDeals 
                    ? \`<span class="deals-badge">\${establishment.dealsCount} deals</span>\` 
                    : ''}
                </h3>
                <div class="restaurant-info">
                  <div>\${establishment.cuisine || 'Various Cuisine'}</div>
                  <div>\${establishment.address}</div>
                  ${establishment.distance 
                    ? \`<div>\${establishment.distance.toFixed(1)} km away</div>\` 
                    : ''}
                </div>
              </div>
            </div>
          \`).join('')}
        </div>
      \`;
    }

    function renderEstablishmentDetails() {
      if (state.loading) {
        return '<div class="loading">Loading restaurant details...</div>';
      }
      
      if (state.error) {
        return \`
          <div class="container">
            <div class="back-button" onclick="navigateToHome()">
              &larr; Back to Restaurants
            </div>
            <div class="error">\${state.error}</div>
          </div>
        \`;
      }
      
      const establishment = state.selectedEstablishment;
      if (!establishment) {
        return \`
          <div class="container">
            <div class="back-button" onclick="navigateToHome()">
              &larr; Back to Restaurants
            </div>
            <div class="error">Restaurant not found</div>
          </div>
        \`;
      }
      
      return \`
        <div class="container">
          <div class="back-button" onclick="navigateToHome()">
            &larr; Back to Restaurants
          </div>
          
          <div class="restaurant-detail">
            <div class="restaurant-header">
              <div class="restaurant-main-image">
                ${establishment.imageUrl 
                  ? \`<img src="\${establishment.imageUrl}" alt="\${establishment.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">\`
                  : \`<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #eee; border-radius: 8px; font-size: 2rem; color: #666;">\${establishment.name.charAt(0)}\${establishment.name.split(' ')[1]?.charAt(0) || ''}</div>\`
                }
              </div>
              <div class="restaurant-header-details">
                <h2>\${establishment.name}</h2>
                <div>\${establishment.cuisine || 'Various Cuisine'}</div>
                <div>\${establishment.address}, \${establishment.city} \${establishment.postalCode}</div>
                <div>Rating: \${establishment.rating || 'Not rated'}</div>
                <div>Price: \${Array(establishment.price || 1).fill('$').join('')}</div>
              </div>
            </div>
            
            <div>
              <h3>Happy Hour Deals</h3>
              ${renderDeals()}
            </div>
          </div>
        </div>
      \`;
    }

    function renderDeals() {
      const deals = state.selectedEstablishmentDeals;
      
      if (deals.length === 0) {
        return '<div>No deals available at this time.</div>';
      }
      
      return \`
        <div class="deals-list">
          ${deals.map(deal => {
            const isActive = isWithinHappyHour(deal);
            return \`
              <div class="deal-card \${isActive ? 'active-deal' : ''}">
                ${isActive ? '<div class="deal-savings">Active Now!</div>' : ''}
                <div class="deal-name">\${deal.drink_name || deal.alcohol_category || 'Special Deal'}</div>
                <div class="deal-price">
                  <span class="deal-regular-price">\${formatCurrency(deal.standard_price)}</span>
                  <span class="deal-happy-hour-price">\${formatCurrency(deal.happy_hour_price)}</span>
                </div>
                <div class="deal-savings">Save \${formatCurrency(deal.savings)} (\${formatPercentage(deal.savingsPercentage)})</div>
                <div class="deal-time">
                  \${deal.valid_days || 'All days'} • \${formatTime(deal.hh_start_time)} - \${formatTime(deal.hh_end_time)}
                </div>
              </div>
            \`;
          }).join('')}
        </div>
      \`;
    }

    function renderApp() {
      const appElement = document.getElementById('app');
      
      // Clear loading indicator
      document.getElementById('loading').style.display = 'none';
      
      // Render the appropriate page
      let content = '';
      if (state.page === 'home') {
        content = renderHome();
      } else if (state.page === 'establishment') {
        content = renderEstablishmentDetails();
      }
      
      appElement.innerHTML = content;
    }

    // Initialize application
    window.onload = function() {
      // Make these functions available globally
      window.navigateToHome = navigateToHome;
      window.navigateToEstablishment = navigateToEstablishment;
      
      // Start by fetching initial data
      navigateToHome();
    };
  </script>
</body>
</html>`;

// Serve the simplified frontend for any path
app.get('*', (req, res) => {
  res.send(indexHtml);
});

// ============ SERVER STARTUP =================

const port = process.env.PORT || 8080;
app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});