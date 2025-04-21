/**
 * Ultra-minimal server for Buzzd App
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
  BUZZD MINIMAL SERVER (STARTED: ${new Date().toISOString()})
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

// API Routes
app.get('/api/establishments', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    console.log('API: Getting establishments');
    // Simple raw query with minimal SQL
    const { rows } = await pool.query('SELECT * FROM establishments');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching establishments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch establishments', 
      message: 'There was an error retrieving the data. Please try again later.',
      details: error.message 
    });
  }
});

app.get('/api/deals/collections/:collectionSlug', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database not connected');
    }
    
    const { collectionSlug } = req.params;
    
    console.log(`API: Getting deals for collection ${collectionSlug}`);
    
    // Simple join with minimal SQL
    const { rows } = await pool.query(`
      SELECT d.*, e.name as establishment_name, e.id as establishment_id 
      FROM deals d
      JOIN establishments e ON d.establishment_id = e.id
    `);
    
    res.json(rows);
  } catch (error) {
    console.error(`Error fetching deals for collection ${req.params.collectionSlug}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch deals', 
      message: 'There was an error retrieving the deals. Please try again later.',
      details: error.message
    });
  }
});

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