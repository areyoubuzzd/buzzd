/**
 * Main entry point for Buzzd app deployment (CommonJS version)
 * This file is automatically detected by deployment systems
 */

// Since this is a CommonJS file, we need to use require
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Add middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(`
=================================================
  BUZZD CJS DEPLOYMENT SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}
Current Directory: ${process.cwd()}
=================================================
`);

// Create a fallback HTML that will always work
const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buzzd - Singapore Happy Hour Deals</title>
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
    h1 { color: #e63946; margin-bottom: 0.5rem; font-size: 2.5rem; }
    p { margin: 0.5rem 0; }
    .subtitle { font-size: 1.2rem; color: #457b9d; margin-bottom: 1.5rem; }
    .message { background: #f1faee; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card { 
      background: white; 
      border-radius: 0.5rem; 
      padding: 1rem; 
      margin: 1rem 0; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: inline-block;
      margin: 0.5rem;
      width: 40%;
    }
    .drinks { display: flex; flex-wrap: wrap; justify-content: center; margin: 1rem 0; }
    .signature { font-style: italic; margin-top: 2rem; color: #1d3557; }
    @media (max-width: 600px) {
      .card { width: 100%; }
    }
  </style>
</head>
<body>
  <h1>Buzzd</h1>
  <p class="subtitle">Singapore's Happy Hour Deals App</p>
  
  <div class="message">
    <p><strong>Coming soon to this URL!</strong></p>
    <p>The best happy hour deals in Singapore at your fingertips.</p>
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
</html>`;

// Create a fallback index.html in case everything else fails
fs.writeFileSync('index.html', fallbackHtml);
console.log('✅ Created fallback index.html');

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
} else {
  console.log('❌ No client directory found, using fallback');
  // If no client path was found, we'll still serve the fallback index.html
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
let db = null;
if (process.env.DATABASE_URL) {
  try {
    console.log('Connecting to database...');
    
    // Configure NeonDB for WebSocket connections
    const { neonConfig } = require('@neondatabase/serverless');
    neonConfig.webSocketConstructor = ws;
    
    // Create a connection pool
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Define a minimal schema directly - this is just for API responses
    const schema = {
      establishments: {
        id: 'id',
        name: 'name',
        address: 'address',
        lat: 'lat',
        lng: 'lng'
      },
      deals: {
        id: 'id',
        establishmentId: 'establishment_id',
        drink_name: 'drink_name',
        happy_hour_price: 'happy_hour_price',
        standard_price: 'standard_price'
      },
      collections: {
        id: 'id',
        name: 'name',
        slug: 'slug',
        priority: 'priority'
      }
    };
    
    // Create a drizzle instance
    db = { 
      pool, 
      execute: async (query) => pool.query(query),
      query: {
        establishments: {
          findMany: async () => {
            const { rows } = await pool.query(`
              SELECT 
                id,
                name,
                address,
                lat,
                lng,
                neighbourhood,
                has_active_deals as "hasActiveDeals",
                logo_url as "logoUrl",
                image_url as "imageUrl",
                cloudflare_image_id as "cloudflareImageId",
                external_id as "externalId",
                created_at as "createdAt",
                updated_at as "updatedAt"
              FROM establishments
              ORDER BY name ASC
            `);
            
            // Process data to calculate proper hasActiveDeals
            return rows.map(establishment => {
              // Add a real value for imageUrl if not present but cloudflare ID exists
              if (!establishment.imageUrl && establishment.cloudflareImageId) {
                establishment.imageUrl = `https://imagedelivery.net/your-account-hash/${establishment.cloudflareImageId}/public`;
              }
              return establishment;
            });
          }
        },
        deals: {
          findMany: async () => {
            // Fetch deals and establishments with proper column aliasing
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
                d.savings_percentage, 
                d.valid_days, 
                d.hh_start_time, 
                d.hh_end_time, 
                d.collections, 
                d.description, 
                d.sort_order, 
                d.image_url as "imageUrl",
                d.image_id as "imageId",
                d.created_at as "createdAt",
                d.updated_at as "updatedAt",
                e.id as "establishment.id",
                e.name as "establishment.name",
                e.address as "establishment.address",
                e.lat as "establishment.lat", 
                e.lng as "establishment.lng",
                e.neighbourhood as "establishment.neighbourhood",
                e.logo_url as "establishment.logoUrl",
                e.image_url as "establishment.imageUrl",
                e.cloudflare_image_id as "establishment.cloudflareImageId",
                e.has_active_deals as "establishment.hasActiveDeals"
              FROM deals d
              JOIN establishments e ON d.establishment_id = e.id
            `);
            
            // Process rows to create proper nested structure
            return rows.map(row => {
              const deal = {};
              const establishment = {};
              
              // Extract establishment properties
              Object.keys(row).forEach(key => {
                if (key.startsWith('establishment.')) {
                  establishment[key.replace('establishment.', '')] = row[key];
                  delete row[key];
                } else {
                  deal[key] = row[key];
                }
              });
              
              // Add establishment to deal
              deal.establishment = establishment;
              
              // Calculate isActive property based on time
              const now = new Date();
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();
              const currentTimeValue = currentHour * 60 + currentMinute;
              
              const startTimeParts = (deal.hh_start_time || '').split(':');
              const endTimeParts = (deal.hh_end_time || '').split(':');
              
              if (startTimeParts.length === 2 && endTimeParts.length === 2) {
                const startTimeValue = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
                const endTimeValue = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
                
                // Check current day
                const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                const currentDay = days[now.getDay()].toLowerCase();
                
                // Check if the deal is valid for the current day
                const validDays = (deal.valid_days || '').toLowerCase();
                let validForToday = false;
                
                if (validDays === 'all days') {
                  validForToday = true;
                } else if (validDays.includes('-')) {
                  // Handle day ranges like mon-fri
                  const [startDay, endDay] = validDays.split('-');
                  const startDayIndex = days.indexOf(startDay);
                  const endDayIndex = days.indexOf(endDay);
                  const currentDayIndex = now.getDay();
                  validForToday = currentDayIndex >= startDayIndex && currentDayIndex <= endDayIndex;
                } else {
                  // Handle comma-separated list like mon,wed,fri
                  validForToday = validDays.split(',').some(day => day.trim() === currentDay);
                }
                
                deal.isActive = validForToday && currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
              } else {
                deal.isActive = false;
              }
              
              return deal;
            });
          }
        },
        collections: {
          findMany: async () => {
            const { rows } = await pool.query(`
              SELECT * FROM collections 
              WHERE active = TRUE
              ORDER BY priority ASC
            `);
            return rows;
          }
        }
      }
    };
    
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
} else {
  console.error('DATABASE_URL environment variable not set');
}

// API Routes
app.get('/api/establishments', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not connected');
    }
    
    console.log('API: Getting establishments');
    const establishments = await db.query.establishments.findMany();
    res.json(establishments);
  } catch (error) {
    console.error('Error fetching establishments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch establishments', 
      message: 'There was an error retrieving the data. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/deals/collections/:collectionSlug', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not connected');
    }
    
    const { collectionSlug } = req.params;
    const { lat, lng } = req.query;
    const radius = Number(req.query.radius) || 5;
    
    console.log(`API: Getting deals for collection ${collectionSlug}, location: ${lat}, ${lng}, radius: ${radius}`);
    
    // Get all deals since we need to filter client-side based on calculated fields
    let deals = await db.query.deals.findMany();
    
    // Filter deals by collection if not "all"
    if (collectionSlug !== 'all') {
      deals = deals.filter(deal => {
        // Check if the deal belongs to the requested collection
        const dealCollections = (deal.collections || '').split(',').map(c => c.trim());
        return dealCollections.includes(collectionSlug);
      });
    }
    
    // If we have lat/lng coordinates, filter by distance
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      if (!isNaN(userLat) && !isNaN(userLng)) {
        deals = deals.filter(deal => {
          const establishment = deal.establishment;
          if (!establishment || !establishment.lat || !establishment.lng) return false;
          
          const estLat = parseFloat(establishment.lat);
          const estLng = parseFloat(establishment.lng);
          
          if (isNaN(estLat) || isNaN(estLng)) return false;
          
          // Calculate distance using Haversine formula
          const R = 6371; // Earth radius in km
          const dLat = (estLat - userLat) * Math.PI / 180;
          const dLon = (estLng - userLng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(estLat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          // Accept deals within radius
          return distance <= radius;
        });
      }
    }
    
    res.json(deals);
  } catch (error) {
    console.error(`Error fetching deals for collection ${req.params.collectionSlug}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch deals', 
      message: 'There was an error retrieving the deals. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/collections', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not connected');
    }
    
    console.log('API: Getting collections');
    const collections = await db.query.collections.findMany();
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ 
      error: 'Failed to fetch collections', 
      message: 'There was an error retrieving the collections. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

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
    dbConnected: db ? true : false,
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
  
  // Otherwise, serve our fallback index.html
  res.sendFile(path.resolve('index.html'));
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
=================================================
  SERVER STARTED
=================================================
Frontend & API: http://localhost:${PORT}
Database Connected: ${db ? 'Yes' : 'No'}
=================================================
`);
});