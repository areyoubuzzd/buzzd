/**
 * Proxy Server for Buzzd App
 * Serves the frontend and forwards API requests to the API server
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = 3001;  // The API server will run on a different port

console.log(`
=================================================
  BUZZD PROXY SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}
Current Directory: ${process.cwd()}
=================================================
`);

// Start API server on a different port
const apiProcess = require('child_process').spawn('node', ['api-server.cjs'], {
  env: { ...process.env, PORT: API_PORT },
  stdio: 'inherit'
});

// Clean up API server when proxy server exits
process.on('exit', () => {
  console.log('Stopping API server...');
  apiProcess.kill();
});

process.on('SIGINT', () => {
  console.log('Stopping API server...');
  apiProcess.kill();
  process.exit();
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check for built React app in various locations
const possibleClientPaths = [
  'dist/public',
  'client/dist',
  'dist',
  'client',
  'public'
];

let clientPath = '';
for (const dirPath of possibleClientPaths) {
  if (fs.existsSync(dirPath)) {
    try {
      const stats = fs.statSync(dirPath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(dirPath);
        if (files.includes('index.html') || files.includes('assets')) {
          clientPath = dirPath;
          console.log(`✅ Found client files at: ${dirPath}`);
          console.log(`Files in ${dirPath}:`, files.join(', '));
          break;
        }
      }
    } catch (err) {
      console.error(`Error checking path ${dirPath}:`, err);
    }
  }
}

// If we found a client path, serve those static files
if (clientPath) {
  app.use(express.static(clientPath));
  console.log(`Serving static files from ${clientPath}`);
} else {
  console.warn('No client files found, API only mode');
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

// Proxy middleware for API requests
app.use('/api', (req, res) => {
  console.log(`Proxying ${req.method} ${req.url} to API server`);
  
  const options = {
    hostname: 'localhost',
    port: API_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  
  // Remove host header to avoid conflicts
  delete options.headers.host;
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  
  proxyReq.on('error', (error) => {
    console.error('Error proxying request:', error);
    res.status(500).json({ 
      error: 'API Gateway Error', 
      message: 'Failed to connect to API server',
      details: error.message
    });
  });
  
  // If there's a request body, write it to the proxy request
  if (req.body) {
    proxyReq.write(JSON.stringify(req.body));
  }
  
  req.pipe(proxyReq, { end: true });
});

// Serve index.html for all other routes to support client-side routing
app.get('*', (req, res) => {
  if (clientPath && fs.existsSync(path.join(clientPath, 'index.html'))) {
    return res.sendFile(path.resolve(path.join(clientPath, 'index.html')));
  } else {
    return res.send(`
      <html>
        <head><title>Buzzd</title></head>
        <body>
          <h1>Buzzd App</h1>
          <p>API gateway is running but no client files found.</p>
          <p>API Test: <a href="/api/test">/api/test</a></p>
        </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
=================================================
  SERVER STARTED
=================================================
Frontend & API Gateway: http://localhost:${PORT}
API Server: http://localhost:${API_PORT}
=================================================
`);
});