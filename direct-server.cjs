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

// Endpoint to check deployment health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database_configured: !!process.env.DATABASE_URL
  });
});

// Start the actual server in a child process
const serverProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe', // Capture output
  env: { 
    ...process.env,
    PORT: 5000 // Run the main server on a different port
  }
});

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

// Proxy all API requests to the server
app.all('/api/*', async (req, res) => {
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