/**
 * Ultra-simple, reliable deployment server for Buzzd
 * This CommonJS script works in both development and production
 */

const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Load environment variables (if .env exists)
try {
  require('dotenv').config();
} catch (err) {
  console.log('No dotenv package found, skipping .env loading');
}

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`
=================================================
  BUZZD DIRECT DEPLOYMENT SERVER
=================================================
Started at: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'development'}
Database: ${process.env.DATABASE_URL ? 'Configured ✅' : 'Not configured ❌'}
=================================================
`);

// Use JSON middleware
app.use(express.json());

// Check for critical environment variables
if (!process.env.DATABASE_URL) {
  console.error('⚠️ WARNING: DATABASE_URL environment variable is not set!');
  console.error('Database features may not work correctly without this variable.');
}

// Endpoints for direct access without proxy
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database_configured: !!process.env.DATABASE_URL,
    server: 'direct-server',
    version: '1.0.1'
  });
});

app.get('/api/deployment-info', async (req, res) => {
  // Add direct database check
  let dbStatus = 'unknown';
  
  // Get environment variables (safely)
  const env = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || '3000',
    DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'not configured',
    // Other safe environment variables to display
    HOSTNAME: process.env.HOSTNAME || 'not set',
    REPL_ID: process.env.REPL_ID || 'not set',
    REPL_OWNER: process.env.REPL_OWNER || 'not set'
  };
  
  // Check database connection directly
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });
      
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as time');
      dbStatus = {
        connected: true,
        time: result.rows[0].time,
        connection_test: 'successful'
      };
      client.release();
    } catch (error) {
      dbStatus = {
        connected: false,
        error: error.message,
        connection_test: 'failed'
      };
    }
  }
  
  res.json({
    timestamp: new Date().toISOString(),
    environment: env,
    server: {
      type: 'direct-server',
      version: '1.0.2',
      started_at: new Date().toISOString()
    },
    database: dbStatus
  });
});

// Debug endpoint to check proxy
app.get('/api/no-proxy', (req, res) => {
  res.json({
    message: "This endpoint is served directly (not proxied)",
    time: new Date().toISOString()
  });
});

// Start the actual server in a child process
let serverProcess;
let serverStartAttempts = 0;
const maxServerStartAttempts = 3;

function startApplicationServer() {
  console.log(`Starting application server (attempt ${serverStartAttempts + 1}/${maxServerStartAttempts})...`);
  
  serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe', // Capture output
    env: { 
      ...process.env,
      PORT: 5000 // Run the main server on a different port
    }
  });
  
  serverStartAttempts++;
  
  // Set timeout to check if server started successfully
  const startupTimeout = setTimeout(() => {
    console.log('Checking if application server started properly...');
    // We'll consider it started if the process is still running
    if (serverProcess && !serverProcess.killed) {
      console.log('Application server appears to be running.');
    } else {
      console.error('Application server failed to start or crashed early.');
      if (serverStartAttempts < maxServerStartAttempts) {
        console.log('Attempting to restart application server...');
        startApplicationServer();
      } else {
        console.error(`Maximum restart attempts (${maxServerStartAttempts}) reached. Falling back to direct service.`);
      }
    }
  }, 10000); // Check after 10 seconds
  
  // Clear timeout if process exits before timeout
  serverProcess.on('exit', () => {
    clearTimeout(startupTimeout);
  });
  
  return serverProcess;
}

// Start the application server
serverProcess = startApplicationServer();

// Pipe output to our console
serverProcess.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data.toString().trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[SERVER ERROR] ${data.toString().trim()}`);
});

serverProcess.on('error', (err) => {
  console.error('Failed to start application server:', err);
});

// Proxy all API requests to the server EXCEPT our direct endpoints
app.all('/api/*', async (req, res, next) => {
  // Skip proxying for our direct endpoints
  if (
    req.path === '/api/health' || 
    req.path === '/api/deployment-info' || 
    req.path === '/api/no-proxy'
  ) {
    return next();
  }
  try {
    const apiUrl = `http://localhost:5000${req.url}`;
    console.log(`Proxy request: ${req.method} ${apiUrl}`);
    
    // Use node-fetch or a similar library to proxy the request
    const fetch = (await import('node-fetch')).default;
    
    const headers = {};
    // Copy headers from the original request
    for (const key in req.headers) {
      if (!['host', 'connection'].includes(key)) {
        headers[key] = req.headers[key];
      }
    }
    
    const response = await fetch(apiUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    });
    
    // Copy status code
    res.status(response.status);
    
    // Copy headers
    for (const [key, value] of Object.entries(response.headers.raw())) {
      if (key !== 'transfer-encoding') {
        res.set(key, value);
      }
    }
    
    // Send body
    const buffer = await response.buffer();
    res.send(buffer);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(502).json({
      error: 'Bad Gateway',
      message: error.message
    });
  }
});

// Serve static files - first look in standard locations
let staticFilesPath = null;
const possiblePaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'client', 'dist'),
  path.join(__dirname, 'public')
];

for (const dir of possiblePaths) {
  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
    staticFilesPath = dir;
    break;
  }
}

if (staticFilesPath) {
  console.log(`Serving static files from: ${staticFilesPath}`);
  app.use(express.static(staticFilesPath));
} else {
  console.warn('No static files found to serve! Frontend may not work correctly.');
}

// For client-side routing - all other routes serve index.html
app.get('*', (req, res) => {
  if (staticFilesPath && fs.existsSync(path.join(staticFilesPath, 'index.html'))) {
    res.sendFile(path.join(staticFilesPath, 'index.html'));
  } else {
    res.status(404).send('Cannot find application files. Please make sure the application is built correctly.');
  }
});

// Start the HTTP server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
=================================================
  SERVER STARTED SUCCESSFULLY
=================================================
Deployment server running at: http://0.0.0.0:${PORT}
Application server running at: http://localhost:5000
=================================================
`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  
  if (serverProcess) {
    serverProcess.kill();
    console.log('Application server stopped');
  }
  
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  
  if (serverProcess) {
    serverProcess.kill();
    console.log('Application server stopped');
  }
  
  process.exit(0);
});