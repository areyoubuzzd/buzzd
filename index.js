/**
 * Absolute-minimum production server for Buzzd app
 * This requires NO build step and creates its own minimal files
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Database imports
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Add middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(`
=================================================
  BUZZD MINIMUM SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}
Current Directory: ${process.cwd()}
=================================================
`);

// First, create a fallback HTML that will always work
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
try {
  console.log('Connecting to database...');
  
  if (process.env.DATABASE_URL) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
      // Try to dynamically import schema
      const schemaModule = await import('./dist/shared/schema.js').catch(() => {
        console.log('Could not load schema from dist, trying direct import');
        return import('./shared/schema.js');
      });
      
      db = drizzle(pool, { schema: schemaModule });
      console.log('✅ Connected to database');
    } catch (importError) {
      console.error('Failed to import schema:', importError);
      
      // Fallback - define minimal schema inline
      const { pgTable, serial, text, integer, boolean, varchar, timestamp } = await import('drizzle-orm/pg-core');
      
      // Minimal schema definition for core tables
      const schema = {
        establishments: pgTable('establishments', {
          id: serial('id').primaryKey(),
          name: varchar('name', { length: 255 }).notNull(),
          address: text('address'),
          lat: varchar('lat', { length: 20 }),
          lng: varchar('lng', { length: 20 }),
          // Add other fields as needed
        }),
        
        deals: pgTable('deals', {
          id: serial('id').primaryKey(),
          establishmentId: integer('establishment_id').notNull(),
          drink_name: varchar('drink_name', { length: 255 }),
          happy_hour_price: integer('happy_hour_price'),
          standard_price: integer('standard_price'),
          valid_days: varchar('valid_days', { length: 50 }),
          hh_start_time: varchar('hh_start_time', { length: 10 }),
          hh_end_time: varchar('hh_end_time', { length: 10 }),
          // Add other fields as needed
        }),
        
        collections: pgTable('collections', {
          id: serial('id').primaryKey(),
          name: varchar('name', { length: 255 }).notNull(),
          slug: varchar('slug', { length: 255 }).notNull(),
          priority: integer('priority').default(50),
          active: boolean('active').default(true),
          // Add other fields as needed
        })
      };
      
      db = drizzle(pool, { schema });
      console.log('✅ Connected to database with fallback schema');
    }
  } else {
    console.error('DATABASE_URL environment variable not set');
  }
} catch (error) {
  console.error('Failed to connect to database:', error);
}

// API Routes
app.get('/api/establishments', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database not connected');
    }
    
    console.log('API: Getting establishments');
    // Try to use the drizzle query builder if available, otherwise fallback to SQL
    try {
      const establishments = await db.query.establishments.findMany();
      res.json(establishments);
    } catch (queryError) {
      console.log('Fallback to raw query for establishments');
      const { rows } = await db.execute('SELECT * FROM establishments');
      res.json(rows);
    }
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
    
    // Try to use the drizzle query builder if available, otherwise fallback to SQL
    try {
      const deals = await db.query.deals.findMany({
        with: {
          establishment: true
        }
      });
      res.json(deals);
    } catch (queryError) {
      console.log('Fallback to raw query for deals');
      const { rows } = await db.execute(`
        SELECT d.*, e.* 
        FROM deals d
        JOIN establishments e ON d.establishment_id = e.id
      `);
      res.json(rows);
    }
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
    
    // Try to use the drizzle query builder if available, otherwise fallback to SQL
    try {
      const collections = await db.query.collections.findMany({
        where: (collections, { eq }) => eq(collections.active, true),
        orderBy: (collections, { asc }) => [asc(collections.priority)]
      });
      res.json(collections);
    } catch (queryError) {
      console.log('Fallback to raw query for collections');
      const { rows } = await db.execute(`
        SELECT * FROM collections 
        WHERE active = TRUE
        ORDER BY priority ASC
      `);
      res.json(rows);
    }
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