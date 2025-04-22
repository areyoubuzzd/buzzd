/**
 * Special Deployment Fix for Replit
 * 
 * This script:
 * 1. Uses a simplified approach that runs both API and frontend on the same port
 * 2. Ensures proper database connectivity
 * 3. Makes sure environment variables are correctly passed
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
  BUZZD DEPLOYMENT FIX SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}
Current Directory: ${process.cwd()}
Available Files: ${fs.readdirSync('.').join(', ')}
Database URL configured: ${process.env.DATABASE_URL ? 'YES' : 'NO'}
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
} else {
  console.log('❌ No client directory found, will serve API only');
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

// Import the API routes directly (this is the key difference - we don't spawn a separate process)
import('./server/index.js').then(module => {
  const { registerRoutes } = module.default || module;
  
  // Register API routes
  if (typeof registerRoutes === 'function') {
    registerRoutes(app);
    console.log('✅ API routes registered successfully');
  } else {
    console.error('❌ Failed to register API routes - registerRoutes is not a function');
  }

  // Add a special diagnostic route
  app.get('/api/diagnostic', (req, res) => {
    res.json({
      status: 'API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: process.env.DATABASE_URL ? 'Configured' : 'Not configured',
      clientPath
    });
  });
  
  // For client-side routing - all routes serve index.html
  app.get('*', (req, res) => {
    if (clientPath && fs.existsSync(path.join(clientPath, 'index.html'))) {
      return res.sendFile(path.resolve(path.join(clientPath, 'index.html')));
    }
    
    // Fall back to API-only mode
    res.status(404).send('Frontend not found. This deployment is running in API-only mode.');
  });
  
  // Start the Express server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
=================================================
  SERVER STARTED
=================================================
Server running on: http://localhost:${PORT}
=================================================
`);
  });
}).catch(err => {
  console.error('Failed to import API routes:', err);
  
  // Start the server anyway (in static-only mode)
  app.get('/api/*', (req, res) => {
    res.status(500).json({ 
      error: 'API unavailable',
      message: 'The API failed to initialize. Check server logs for details.'
    });
  });
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
=================================================
  SERVER STARTED (STATIC-ONLY MODE)
=================================================
Server running on: http://localhost:${PORT}
WARNING: API routes failed to initialize!
=================================================
`);
  });
});