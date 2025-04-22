/**
 * Ultra-minimal production server for Buzzd app
 * No proxy, no fancy stuff - just direct execution of the main server
 */

// Use regular require for maximum compatibility
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

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
    const fetch = require('node-fetch');
    
    // Try to connect to database
    let dbStatus = 'unknown';
    try {
      const { Pool } = require('@neondatabase/serverless');
      const pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = `error: ${err.message}`;
    }
    
    // Check if inner server is running
    let innerServerRunning = false;
    try {
      const response = await fetch(`http://localhost:${innerPort}/api/collections`);
      innerServerRunning = response.ok;
    } catch (e) {
      innerServerRunning = false;
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: 'ultra-simple-server',
      database: dbStatus,
      innerServer: innerServerRunning ? 'running' : 'starting',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'not configured',
        PORT: process.env.PORT || 'not set',
        INNER_PORT: innerPort
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
  // Skip the servercheck endpoint
  if (req.path === '/api/servercheck') {
    return next();
  }
  
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
    const fetch = require('node-fetch');
    const response = await fetch(apiUrl, {
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
  ULTRA-SIMPLE SERVER STARTING UP
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
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data.trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data.trim()}`);
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
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
  // Only handle API checking route directly
  if (req.path === '/api/servercheck') {
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
          if (data.innerServer === 'running') {
            window.location.reload();
          } else {
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

// Only start listening if we're the main module (not imported)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  exec('pkill -f "tsx server/index.ts" || true');
  process.exit(0);
});