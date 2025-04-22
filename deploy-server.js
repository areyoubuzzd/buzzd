/**
 * Ultra-minimal production server for Buzzd app - ES Module Version
 * Version 1.2.0
 * 
 * Features:
 * - Direct API server execution
 * - Enhanced health checking through /api/servercheck
 * - Database connectivity verification
 * - Improved server startup detection
 * - Dynamic client file detection
 */

// Use ES modules syntax for compatibility with "type": "module" in package.json
import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodeFetch from 'node-fetch';
import { Pool } from '@neondatabase/serverless';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Direct health check endpoint
app.get('/api/servercheck', async (req, res) => {
  try {
    // Check if we can access the inner server
    const innerPort = parseInt(process.env.PORT || '3000') + 1;
    
    // Try to connect to database
    let dbStatus = 'unknown';
    let dbDetails = '';
    try {
      const pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'error';
      dbDetails = err.message;
      console.error('Database connection error:', err.message);
    }
    
    // Check if inner server is running by trying different endpoints
    let innerServerRunning = false;
    let innerServerDetails = 'not responding';
    let apiEndpoints = ['/api/collections', '/api/deals/collections/all?lat=1.3521&lng=103.8198'];
    
    // Try each endpoint until we get a successful response
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Checking inner server by requesting ${endpoint}...`);
        const response = await nodeFetch(`http://localhost:${innerPort}${endpoint}`);
        
        if (response.ok) {
          innerServerRunning = true;
          innerServerDetails = `responding on ${endpoint}`;
          // No need to check other endpoints if one succeeded
          break;
        } else {
          innerServerDetails = `responded with status ${response.status} on ${endpoint}`;
        }
      } catch (e) {
        innerServerDetails = `connection failed on ${endpoint}: ${e.message}`;
        console.error(`Inner server check failed on ${endpoint}:`, e.message);
        // Continue to try other endpoints
      }
    }
    
    // Get direct inner server logs
    let innerServerStarted = false;
    try {
      const childProcess = exec('ps aux | grep "tsx server/index.ts" | grep -v grep');
      childProcess.stdout.on('data', (data) => {
        if (data.trim()) {
          innerServerStarted = true;
        }
      });
    } catch (e) {
      console.error('Error checking process list:', e.message);
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: 'deploy-server',
      version: '1.2.0',
      database: {
        status: dbStatus,
        details: dbDetails
      },
      innerServer: {
        running: innerServerRunning,
        processFound: innerServerStarted,
        status: innerServerRunning ? 'running' : 'starting',
        details: innerServerDetails,
        port: innerPort
      },
      env: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'not configured',
        PORT: process.env.PORT || 'not set'
      }
    });
  } catch (error) {
    res.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Add proxy for API requests
app.all('/api/*', async (req, res, next) => {
  // Don't skip the servercheck endpoint - we now want to proxy it to the inner server
  // to ensure the inner server is truly alive
  
  try {
    // The inner server runs on PORT + 1
    const innerPort = parseInt(process.env.PORT || '3000') + 1;
    const apiUrl = `http://localhost:${innerPort}${req.url}`;
    
    console.log(`[PROXY] ${req.method} ${apiUrl}`);
    
    // Get request body if needed
    const body = ['GET', 'HEAD'].includes(req.method) 
      ? undefined
      : JSON.stringify(req.body);
    
    // Make the fetch request to the inner server
    const response = await nodeFetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body
    });
    
    // Copy status
    res.status(response.status);
    
    // Send response data
    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('[PROXY ERROR]', error.message);
    res.status(502).json({
      error: 'Server starting',
      message: 'The server is still starting up. Please try again in a moment.'
    });
  }
});

// Skip proxy altogether and just run the main app directly
console.log(`
=================================================
  DEPLOYMENT SERVER STARTING UP
=================================================
NODE_ENV: ${process.env.NODE_ENV || 'not set'}
DATABASE_URL: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}
PORT: ${PORT}
=================================================
`);

// Start by cleaning up any possible running server
exec('pkill -f "tsx server/index.ts" || true', (error) => {
  if (error) {
    console.log('No existing server found to clean up');
  } else {
    console.log('Cleaned up any existing server processes');
  }
  
  // Now directly run the development server
  // Use a different port for the inner server
  const innerPort = parseInt(PORT) + 1;
  console.log(`Starting inner server on port ${innerPort}...`);
  
  const serverProcess = exec(`tsx server/index.ts`, {
    env: {
      ...process.env,
      PORT: innerPort.toString(), 
      NODE_ENV: process.env.NODE_ENV || 'production',
      DATABASE_URL: process.env.DATABASE_URL
    }
  });
  
  // Track inner server startup status
  let innerServerStarted = false;
  
  serverProcess.stdout.on('data', (data) => {
    const trimmedData = data.trim();
    console.log(`[SERVER] ${trimmedData}`);
    
    // Check for the inner server ready signal
    if (trimmedData.includes('Inner server running')) {
      innerServerStarted = true;
      console.log('✅ DEPLOYMENT: Inner API server has started successfully');
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data.trim()}`);
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    if (!innerServerStarted) {
      console.error('⚠️ WARNING: Inner server process exited before fully starting up');
    }
  });
});

// Check for client side files to serve
const possibleClientPaths = [
  'dist',
  'client/dist',
  'dist/public',
  'client',
  'public'
];

// Find client files to serve
let clientDirectory = null;
for (const dir of possibleClientPaths) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    if (files.includes('index.html') || files.includes('assets')) {
      clientDirectory = dir;
      console.log(`Found client files in: ${dir}`);
      break;
    }
  }
}

// Serve static client files if available
if (clientDirectory) {
  console.log(`Serving static files from: ${clientDirectory}`);
  app.use(express.static(clientDirectory));
}

// For frontend routing - serve the main app or a splash screen
app.get('*', (req, res, next) => {
  // Forward API requests to the proxy
  if (req.path.startsWith('/api/')) {
    return next();
  }

  // If we found a client directory, try to serve its index.html
  if (clientDirectory && fs.existsSync(`${clientDirectory}/index.html`)) {
    console.log(`Serving index.html from ${clientDirectory}`);
    return res.sendFile(path.resolve(`${clientDirectory}/index.html`));
  }
  
  // If we don't have a client directory, show the loading/splash page
  console.log('No client directory found, serving splash screen');
  res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
  <title>Buzzd - Starting Up</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif; background: #1c1c1c; color: #fff; text-align: center; padding: 50px 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { color: #ff9b42; font-size: 2em; margin-bottom: 10px; }
    p { line-height: 1.6; opacity: 0.9; }
    .loader { border: 5px solid rgba(255, 155, 66, 0.2); border-top: 5px solid #ff9b42; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 30px auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .subtitle { color: #ff9b42; font-weight: bold; }
    .status { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 5px; margin-top: 30px; text-align: left; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Buzzd App</h1>
    <p class="subtitle">Deployment In Progress</p>
    <div class="loader"></div>
    <p>Please wait while the server initializes...</p>
    <p>This process may take up to 30 seconds.</p>
    <div class="status">
      <p>Server Status: Starting main application</p>
      <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
      <p>Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}</p>
    </div>
  </div>
  <script>
    // Retry connecting to the app every 3 seconds
    function checkServerStatus() {
      fetch('/api/servercheck')
        .then(response => response.json())
        .then(data => {
          console.log('Server status:', data);
          if (data.ok === true && data.message === "Inner server is alive") {
            console.log("✅ Inner server is alive, reloading page");
            window.location.reload();
          } else if (data.innerServer === 'running') {
            // Support old format for backward compatibility
            console.log("✅ Inner server is running (legacy format), reloading page");
            window.location.reload();
          } else {
            console.log("⏳ Inner server not ready yet, retrying in 3 seconds");
            setTimeout(checkServerStatus, 3000);
          }
        })
        .catch(err => {
          console.error('Error checking server status:', err);
          setTimeout(checkServerStatus, 3000);
        });
    }
    
    // Start checking server status
    setTimeout(checkServerStatus, 3000);
  </script>
</body>
</html>
  `);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  exec('pkill -f "tsx server/index.ts" || true');
  process.exit(0);
});