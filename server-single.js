/**
 * Unified Server for Buzzd App
 * This server handles both API routes and static file serving
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Pool } from '@neondatabase/serverless';
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

// Set up database connection
const neonConfig = { webSocketConstructor: ws };
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Environment variables to control optional services
process.env.DISABLE_CLOUDINARY = process.env.NODE_ENV === 'production' ? 'true' : process.env.DISABLE_CLOUDINARY;
process.env.DISABLE_CLOUDFLARE = process.env.NODE_ENV === 'production' ? 'true' : process.env.DISABLE_CLOUDFLARE;

// Dynamic import and registration for API routes
async function setupRoutes() {
  try {
    // Core API routes - these are critical and should always be loaded
    console.log('Setting up core API routes...');
    
    // Import and register establishments routes
    const establishmentsModule = await import('./server/routes/establishments.ts');
    app.use('/api/establishments', establishmentsModule.default);
    app.use('/api/v2/establishments', establishmentsModule.default); // v2 compatibility
    
    // Import and register deals routes
    const dealsModule = await import('./server/routes/deals.ts');
    app.use('/api/deals', dealsModule.default);
    app.use('/api/v2/deals', dealsModule.default); // v2 compatibility
    
    // Import and register collections routes
    const collectionsModule = await import('./server/routes/collections.ts');
    app.use('/api/collections', collectionsModule.default);
    
    // Import and register locations routes
    const locationsModule = await import('./server/routes/locations.ts');
    app.use('/api/locations', locationsModule.default);
    
    console.log('✅ Core API routes registered successfully');
    
    // Optional services - these can be disabled without breaking core functionality
    
    // Image generation routes (optional)
    try {
      const imageGenModule = await import('./server/routes/imageGenerationRoutes.ts');
      app.use('/api/image-generation', imageGenModule.default);
      console.log('✅ Image generation routes registered');
    } catch (err) {
      console.log('⚠️ Image generation routes not available:', err.message);
    }
    
    // Cloudinary routes (optional - can be disabled)
    if (process.env.DISABLE_CLOUDINARY !== 'true') {
      try {
        const cloudinaryModule = await import('./server/routes/cloudinaryRoutes.js');
        app.use('/', cloudinaryModule.default);
        console.log('✅ Cloudinary routes registered');
      } catch (err) {
        console.log('⚠️ Cloudinary routes not available:', err.message);
      }
    } else {
      console.log('ℹ️ Cloudinary routes disabled by environment variable');
      
      // Add a stub endpoint to handle any requests that would normally go to Cloudinary
      app.use('/api/cloudinary', (req, res) => {
        res.status(503).json({
          error: 'Cloudinary service disabled',
          message: 'Cloudinary integration is currently disabled in this environment.'
        });
      });
    }
    
    // Cloudflare routes (optional - can be disabled)
    if (process.env.DISABLE_CLOUDFLARE !== 'true') {
      try {
        const cloudflareModule = await import('./server/routes/cloudflare-images.ts');
        app.use('/', cloudflareModule.default);
        console.log('✅ Cloudflare routes registered');
      } catch (err) {
        console.log('⚠️ Cloudflare routes not available:', err.message);
      }
    } else {
      console.log('ℹ️ Cloudflare routes disabled by environment variable');
      
      // Add a stub endpoint to handle any requests that would normally go to Cloudflare
      app.use('/api/cloudflare', (req, res) => {
        res.status(503).json({
          error: 'Cloudflare service disabled',
          message: 'Cloudflare integration is currently disabled in this environment.'
        });
      });
    }
    
    // Local image routes (less optional but still separate)
    try {
      const localImagesModule = await import('./server/routes/local-images.ts');
      app.use('/', localImagesModule.default);
      console.log('✅ Local image routes registered');
    } catch (err) {
      console.log('⚠️ Local image routes not available:', err.message);
    }
    
    console.log('✅ All API routes setup completed');
  } catch (error) {
    console.error('❌ Critical error setting up routes:', error);
    // Don't exit the process on error - try to continue with what we have
    console.error('Continuing with limited functionality...');
  }
}

// Setup routes before starting the server
await setupRoutes();

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
          .note {
            font-size: 0.875rem;
            opacity: 0.8;
            margin-top: 2rem;
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
        
        <p>API server is running. Client files not found.</p>
        
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