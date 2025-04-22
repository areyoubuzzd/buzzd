/**
 * Production-Ready Deployment Server for Buzzd App
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 5000;

// Add middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(`
=================================================
  BUZZD PRODUCTION SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}
Current Directory: ${process.cwd()}
Available Files: ${fs.readdirSync('.').join(', ')}
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

// Start the API server on a different port, with environment vars to disable optional features
let apiProcess;
try {
  console.log(`Starting API server on port ${API_PORT}...`);
  apiProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env, 
      PORT: API_PORT.toString(),
      DISABLE_CLOUDINARY: 'true',
      DISABLE_CLOUDFLARE: 'true',
      NODE_ENV: 'production'
    }
  });

  apiProcess.on('error', (err) => {
    console.error('Failed to start API server:', err);
  });
} catch (error) {
  console.error('Error starting API server:', error);
}

// Handle API routes - proxy them to the API server
app.all('/api/*', async (req, res) => {
  try {
    // Create a proxy URL to the internal API
    const apiUrl = `http://127.0.0.1:${API_PORT}${req.url}`;
    console.log(`Proxying API request to: ${apiUrl}`);
    
    // Forward the request to the API
    const fetch = (await import('node-fetch')).default;
    const apiResponse = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.get('Content-Type') || 'application/json',
        'Accept': req.get('Accept') || 'application/json',
        'Cookie': req.get('Cookie') || '',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });
    
    // Forward the API response back to the client
    const contentType = apiResponse.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    
    // Set all headers from the API response
    apiResponse.headers.forEach((value, name) => {
      if (name !== 'transfer-encoding') {
        res.setHeader(name, value);
      }
    });
    
    // Set the status code
    res.status(apiResponse.status);
    
    // Send the body
    const responseBody = await apiResponse.text();
    res.send(responseBody);
  } catch (error) {
    console.error('API proxy error:', error);
    
    // Fall back to direct database access if proxy fails
    res.status(503).json({ 
      error: 'API service unavailable', 
      message: 'The backend service is currently unavailable. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add a special test route for diagnostics
app.get('/api-test', (req, res) => {
  res.json({
    status: 'API Test',
    apiProcess: apiProcess ? 'Started' : 'Not started',
    environment: process.env.NODE_ENV,
    port: PORT,
    apiPort: API_PORT,
    clientPath
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
Frontend: http://localhost:${PORT}
API: http://localhost:${API_PORT}
=================================================
`);
});