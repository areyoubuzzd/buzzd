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
            const { rows } = await pool.query('SELECT * FROM establishments');
            return rows;
          }
        },
        deals: {
          findMany: async () => {
            const { rows } = await pool.query(`
              SELECT d.*, e.* 
              FROM deals d
              JOIN establishments e ON d.establishment_id = e.id
            `);
            return rows;
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
    
    const deals = await db.query.deals.findMany();
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