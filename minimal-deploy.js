/**
 * Minimal Deployment Server for Buzzd App
 * This is a super-simple version with no bells and whistles
 */

import express from 'express';
import { Pool } from '@neondatabase/serverless';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for deployment");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware
app.use(express.json());

console.log(`Starting minimal server on port ${PORT}`);

// Helper function for Singapore time conversion
function getSingaporeTime(date = new Date()) {
  return new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (8 * 60 * 60000));
}

// API Routes
// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Get all establishments
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
        external_id as "externalId"
      FROM establishments 
      ORDER BY name ASC
    `);
    
    // Format response to add lat/lng fields
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
      message: 'Database error'
    });
  }
});

// 3. Get a specific establishment with its deals
app.get('/api/establishments/:establishmentId', async (req, res) => {
  try {
    const { establishmentId } = req.params;
    console.log(`Getting establishment ${establishmentId}`);
    
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
    
    // Add lat/lng for frontend
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
        image_id as "imageId"
      FROM deals 
      WHERE establishment_id = $1`,
      [establishmentId]
    );
    
    const formattedResponse = {
      establishment: establishment,
      activeDeals: dealRows
    };
    
    res.json(formattedResponse);
  } catch (error) {
    console.error(`Error fetching establishment ${req.params.establishmentId}:`, error);
    res.status(500).json({
      error: 'Failed to fetch establishment',
      message: 'Database error'
    });
  }
});

// 4. Get collections
app.get('/api/collections', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        slug, 
        name, 
        description, 
        priority, 
        icon, 
        active
      FROM collections
      WHERE active = true
      ORDER BY priority ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({
      error: 'Failed to fetch collections'
    });
  }
});

// 5. Get deals for collection
app.get('/api/deals/collections/:collectionSlug', async (req, res) => {
  try {
    const { collectionSlug } = req.params;
    console.log(`Getting deals for collection: ${collectionSlug}`);
    
    // Get location parameters
    const lat = parseFloat(req.query.lat) || 1.3521; // Default to Singapore center
    const lng = parseFloat(req.query.lng) || 103.8198;
    const radius = parseFloat(req.query.radius) || 5; // Default 5km radius
    
    // For "all" collection, just get all deals within radius
    const dealsQuery = `
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
        e.name as "establishmentName",
        e.address as "establishmentAddress",
        e.city as "establishmentCity",
        e.latitude as "establishmentLat",
        e.longitude as "establishmentLng",
        e.cuisine as "establishmentCuisine",
        e.rating as "establishmentRating",
        e.image_url as "establishmentImageUrl"
      FROM deals d
      JOIN establishments e ON d.establishment_id = e.id
      ORDER BY d.sort_order ASC
      LIMIT 50
    `;
    
    // Execute the query
    const { rows: deals } = await pool.query(dealsQuery);
    console.log(`Fetched ${deals.length} deals from ${collectionSlug}`);
    
    // Process deals to add isActive property and format response
    const processedDeals = deals.map(deal => {
      // Format the establishment data embedded in the deal
      const establishment = {
        id: deal.establishmentId,
        name: deal.establishmentName,
        address: deal.establishmentAddress,
        city: deal.establishmentCity,
        latitude: deal.establishmentLat,
        longitude: deal.establishmentLng,
        lat: deal.establishmentLat,
        lng: deal.establishmentLng,
        cuisine: deal.establishmentCuisine,
        rating: deal.establishmentRating,
        imageUrl: deal.establishmentImageUrl
      };
      
      return { 
        ...deal,
        isActive: true, // Simplify by assuming all deals are active
        establishment
      };
    });
    
    res.json(processedDeals);
  } catch (error) {
    console.error(`Error fetching deals:`, error);
    res.status(500).json({
      error: 'Failed to fetch deals'
    });
  }
});

// 6. Basic UI at the root
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buzzd API Server</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
      }
      h1 { color: #E63946; }
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
    <p>Server is running. Available endpoints:</p>
    
    <div class="endpoint">GET /api/establishments</div>
    <div class="endpoint">GET /api/establishments/:id</div>
    <div class="endpoint">GET /api/collections</div>
    <div class="endpoint">GET /api/deals/collections/:slug</div>
    
    <p>Server started at: ${new Date().toISOString()}</p>
  </body>
  </html>`);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});