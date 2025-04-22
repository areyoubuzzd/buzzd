/**
 * Ultra-simple deployment server for Buzzd App
 * This file directly combines the frontend and API in a single server
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import session from 'express-session';
import MemoryStore from 'memorystore';

// Load environment variables
dotenv.config();

// For Neon Database connection
neonConfig.webSocketConstructor = ws;

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session storage
const SessionStore = MemoryStore(session);
const sessionStore = new SessionStore({
  checkPeriod: 86400000 // 24 hours
});

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || 'buzzd-happy-hour-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Add middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(`
=================================================
  BUZZD DEPLOYMENT SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || 'development'}
Database URL configured: ${process.env.DATABASE_URL ? 'YES' : 'NO'}
=================================================
`);

// Verify database connection
let dbConnected = false;
if (process.env.DATABASE_URL) {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful:', res.rows[0].now);
    client.release();
    dbConnected = true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
}

// Initialize API routes
console.log('Initializing API routes...');
let apiRoutesRegistered = false;

try {
  // Import the server module directly
  const { default: initServer } = await import('./server/index.js');
  if (typeof initServer === 'function') {
    await initServer(app);
    console.log('✅ API routes initialized successfully');
    apiRoutesRegistered = true;
  } else {
    console.error('❌ Server module exports unexpected format:', initServer);
  }
} catch (err) {
  console.error('❌ Failed to initialize API routes:', err);
}

// Find and serve static client files
const clientPath = fs.existsSync('dist') ? 'dist' : 
                  (fs.existsSync('client/dist') ? 'client/dist' : 'public');

if (fs.existsSync(clientPath)) {
  console.log(`✅ Serving client files from: ${clientPath}`);
  app.use(express.static(clientPath));
}

// Serve other static directories
['public', 'assets', 'images'].forEach(dir => {
  if (fs.existsSync(dir)) {
    app.use(`/${dir}`, express.static(dir));
    console.log(`✅ Serving additional static files from: ${dir}`);
  }
});

// Add diagnostic route
app.get('/api/diagnostic', (req, res) => {
  res.json({
    status: 'Deployment diagnostic',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databaseConnected: dbConnected,
    apiRoutesRegistered,
    clientPath,
    nodeVersion: process.version
  });
});

// For client-side routing - serve index.html for all unmatched routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Try to find index.html in different locations
  const possibleIndexLocations = [
    path.join(clientPath, 'index.html'),
    'dist/index.html',
    'public/index.html',
    'index.html'
  ];
  
  for (const indexPath of possibleIndexLocations) {
    if (fs.existsSync(indexPath)) {
      return res.sendFile(path.resolve(indexPath));
    }
  }
  
  // Last resort fallback
  res.status(404).send('Application files not found. Deployment may be incomplete.');
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
=================================================
  SERVER STARTED
=================================================
Server running on: http://0.0.0.0:${PORT}
Database connection: ${dbConnected ? '✅ Connected' : '❌ Failed'}
API routes: ${apiRoutesRegistered ? '✅ Registered' : '❌ Failed'}
=================================================
`);
});