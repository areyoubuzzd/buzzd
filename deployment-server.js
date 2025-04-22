/**
 * Ultra-Simple Deployment Server for Buzzd App
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { createServer } from 'http';

// For Neon Database connection
neonConfig.webSocketConstructor = ws;

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 5000;

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session storage setup
const SessionStore = MemoryStore(session);
const sessionStore = new SessionStore({
  checkPeriod: 86400000 // 24 hours
});

// Add middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

console.log(`
=================================================
  BUZZD SIMPLIFIED DEPLOYMENT SERVER
=================================================
Started at: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'production'}
Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}
Port: ${PORT}
=================================================
`);

// Test database connection
async function testDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    return false;
  }

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Find and serve static files
function setupStaticFiles() {
  // Possible locations of static files
  const possibleClientPaths = [
    'dist',
    'client/dist',
    'public'
  ];

  let clientPath = null;
  for (const dir of possibleClientPaths) {
    if (fs.existsSync(dir)) {
      if (fs.existsSync(path.join(dir, 'index.html'))) {
        clientPath = dir;
        break;
      }
    }
  }

  if (clientPath) {
    console.log(`✅ Serving static files from ${clientPath}`);
    app.use(express.static(clientPath));
  } else {
    console.warn('⚠️ No client directory with index.html found');
  }

  // Serve other static directories
  const additionalAssetDirs = [
    'public',
    'public/images',
    'public/assets',
    'assets',
    'images'
  ];

  additionalAssetDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      app.use('/' + path.basename(dir), express.static(dir));
      console.log(`✅ Serving additional assets from ${dir}`);
    }
  });

  return clientPath;
}

// Healthcheck endpoint
app.get('/api/healthcheck', async (req, res) => {
  const dbConnected = await testDatabaseConnection();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Start API server in child process
import { spawn } from 'child_process';
import { default as fetch } from 'node-fetch';

// Start the API server as a separate process
function startApiServer() {
  console.log(`Starting API server on port ${API_PORT}...`);
  
  // Set environment variables for the API server
  const env = {
    ...process.env,
    PORT: API_PORT.toString(),
    NODE_ENV: 'production'
  };
  
  // Start the server using the appropriate command
  const serverProcess = spawn('tsx', ['server/index.ts'], {
    env,
    stdio: 'inherit'
  });
  
  serverProcess.on('error', (err) => {
    console.error('Failed to start API server:', err);
  });
  
  return serverProcess;
}

// Proxy API requests to the API server
function setupApiProxy() {
  app.all('/api/*', async (req, res) => {
    try {
      const apiUrl = `http://localhost:${API_PORT}${req.url}`;
      console.log(`Proxying to API: ${req.method} ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: req.method,
        headers: {
          'Content-Type': req.get('Content-Type') || 'application/json',
          'Accept': req.get('Accept') || 'application/json',
          'Cookie': req.get('Cookie') || ''
        },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
      });
      
      // Copy headers from API response
      response.headers.forEach((value, name) => {
        if (name !== 'transfer-encoding') {
          res.setHeader(name, value);
        }
      });
      
      // Send status and body
      res.status(response.status);
      const responseText = await response.text();
      res.send(responseText);
    } catch (error) {
      console.error('API proxy error:', error);
      res.status(503).json({
        error: 'API service unavailable',
        message: 'The API server is not responding. Please try again later.'
      });
    }
  });
}

// Main function to start everything
async function startServer() {
  // Test database connection
  await testDatabaseConnection();
  
  // Setup static files
  const clientPath = setupStaticFiles();
  
  // Start API server
  const apiProcess = startApiServer();
  
  // Setup API proxy
  setupApiProxy();
  
  // For client-side routing - all routes serve index.html
  app.get('*', (req, res) => {
    if (clientPath && fs.existsSync(path.join(clientPath, 'index.html'))) {
      return res.sendFile(path.resolve(path.join(clientPath, 'index.html')));
    }
    
    // Fallback
    res.status(404).send('Application files not found');
  });
  
  // Create HTTP server
  const server = createServer(app);
  
  // Start server
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`
=================================================
  SERVER STARTED
=================================================
Frontend server running at: http://0.0.0.0:${PORT}
API server running at: http://localhost:${API_PORT}
=================================================
`);
  });
  
  // Handle server shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    server.close(() => {
      console.log('HTTP server closed');
      if (apiProcess) {
        apiProcess.kill();
        console.log('API process terminated');
      }
    });
  });
}

// Start everything
startServer().catch(err => {
  console.error('Failed to start server:', err);
});