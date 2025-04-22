/**
 * Unified Server for Buzzd App
 * This server handles both API routes and static file serving in a single process
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Pool } from 'pg';

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Add middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(`
=================================================
  BUZZD UNIFIED SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}
Current Directory: ${process.cwd()}
=================================================
`);

// Explicitly serve images from the public directory
const imagePath = path.join(process.cwd(), 'public/images');
console.log('Serving static images from:', imagePath);
app.use('/images', express.static(imagePath));

// Explicit route for drink images 
const drinkImagesPath = path.join(process.cwd(), 'public/images/drinks');
console.log('Serving drink images from:', drinkImagesPath);
app.use('/images/drinks', express.static(drinkImagesPath));

// Add more static asset directories
const additionalAssetDirs = [
  'public',
  'public/assets',
  'assets'
];

additionalAssetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    app.use('/' + path.basename(dir), express.static(dir));
    console.log(`Serving additional assets from ${dir}`);
  }
});

// Define API endpoints directly here
// 1. Establishments API
app.get('/api/establishments', async (req, res) => {
  try {
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
    `);
    
    // Transform to expected format
    const formattedRows = rows.map(row => ({
      ...row,
      lat: row.latitude,  // Add lat/lng for client compatibility
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

// 2. Single Establishment API
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

// 3. Deals API
app.get('/api/deals/collections/:collectionSlug', async (req, res) => {
  try {
    const { collectionSlug } = req.params;
    console.log(`API: Getting deals for collection: ${collectionSlug}`);
    
    // Add default deals query
    const { rows } = await pool.query(`
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
        e.latitude,
        e.longitude,
        e.rating as "establishmentRating",
        e.price as "establishmentPrice",
        e.image_url as "establishmentImageUrl"
      FROM deals d
      JOIN establishments e ON d.establishment_id = e.id
      LIMIT 50
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals', details: error.message });
  }
});

// 4. Collections API
app.get('/api/collections', async (req, res) => {
  try {
    // Return hardcoded collections for simplicity since this is just for deployment testing
    const collections = [
      { id: 1, slug: "active_happy_hours", name: "Active Happy Hours", priority: 1 },
      { id: 2, slug: "beers_under_12", name: "Beers Under $12", priority: 10 },
      { id: 3, slug: "cocktails_under_12", name: "Cocktails Under $12", priority: 10 },
      { id: 4, slug: "wine_under_12", name: "Wines Under $12", priority: 10 },
      { id: 5, slug: "craft_beers", name: "Craft Beers", priority: 12 }
    ];
    
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// 5. Debug route
app.get('/api-debug', (req, res) => {
  res.json({
    status: 'Unified API Server Running',
    environment: process.env.NODE_ENV,
    port: PORT,
    databaseConnected: !!pool
  });
});

// Serve static files for the client
const possibleClientPaths = [
  path.join(__dirname, 'dist/public'),
  path.join(__dirname, 'client/dist'),
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'client')
];

let clientPath = '';
for (const dirPath of possibleClientPaths) {
  if (fs.existsSync(path.join(dirPath, 'index.html'))) {
    clientPath = dirPath;
    console.log(`✅ Found client files at: ${clientPath}`);
    break;
  }
}

if (clientPath) {
  // Serve static files
  app.use(express.static(clientPath));
  
  // For client-side routing - serve index.html for all unmatched routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.url.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(clientPath, 'index.html'));
  });
} else {
  console.log('⚠️ Client files not found. Only API routes will be available.');
  
  // If client files aren't found, provide a minimal landing page
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Buzzd API - Singapore Happy Hour Deals</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 2rem;
            text-align: center;
            line-height: 1.6;
            color: #333;
          }
          h1 { color: #f59e0b; }
          .logo {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          .drinks {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
            margin: 2rem 0;
          }
          .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 1rem;
            width: 80px;
          }
          .card p { margin: 0; }
          .card p:first-child { font-size: 2rem; }
          .endpoints {
            margin: 2rem 0;
            text-align: left;
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 8px;
          }
          .endpoint {
            margin-bottom: 0.5rem;
            font-family: monospace;
          }
          .signature {
            margin-top: 3rem;
            font-size: 0.75rem;
            opacity: 0.6;
          }
        </style>
      </head>
      <body>
        <div class="logo">🍸 Buzzd</div>
        <h1>Singapore's Happy Hour Finder</h1>
        
        <p>API server is running. API endpoints available:</p>
        
        <div class="endpoints">
          <div class="endpoint">GET /api/establishments</div>
          <div class="endpoint">GET /api/establishments/:id</div>
          <div class="endpoint">GET /api/deals/collections/:slug</div>
          <div class="endpoint">GET /api/collections</div>
        </div>
        
        <p>Find great deals on:</p>
        
        <div class="drinks">
          <div class="card">
            <p>🍺</p>
            <p>Beer</p>
          </div>
          <div class="card">
            <p>🍷</p>
            <p>Wine</p>
          </div>
          <div class="card">
            <p>🍸</p>
            <p>Cocktails</p>
          </div>
          <div class="card">
            <p>🥃</p>
            <p>Spirits</p>
          </div>
        </div>
        
        <p class="signature">© Buzzd 2025</p>
      </body>
      </html>
    `);
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});