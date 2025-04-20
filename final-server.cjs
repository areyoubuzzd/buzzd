/**
 * Final Production Server for Buzzd App
 * This solution first builds the client, then sets up a server
 * that handles both static file serving and API requests
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Path to static files (will be filled later)
let staticPath = '';

// Log startup information
console.log(`
======================================================
  BUZZD PRODUCTION SERVER - FINAL VERSION
======================================================
Environment: ${process.env.NODE_ENV || 'development'}
Date: ${new Date().toISOString()}
Current directory: ${process.cwd()}
Files in current directory: ${fs.readdirSync('.').join(', ')}
======================================================
`);

// Build the client if it hasn't been built already
if (!fs.existsSync('client/dist') && fs.existsSync('client/src')) {
  try {
    console.log('Building client...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Client built successfully!');
  } catch (error) {
    console.error('Error building client:', error);
  }
}

// Determine where to serve static files from
if (fs.existsSync('client/dist')) {
  staticPath = 'client/dist';
  console.log('Using client/dist for static files');
} else if (fs.existsSync('dist')) {
  staticPath = 'dist';
  console.log('Using dist for static files');
} else if (fs.existsSync('client')) {
  staticPath = 'client';
  console.log('Using client directory for static files');
} else {
  console.log('No static file directory found!');
  // Create minimal client directory
  fs.mkdirSync('client', { recursive: true });
  staticPath = 'client';
  
  // Create a minimal index.html
  const minimalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buzzd - Happy Hour Deals</title>
  <style>
    body { 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 2rem;
      text-align: center;
    }
    h1 { color: #e63946; }
  </style>
</head>
<body>
  <div id="root">
    <h1>Buzzd</h1>
    <p>The Singapore Happy Hour Deals App</p>
    <p>Missing frontend files. Please check deployment configuration.</p>
  </div>
</body>
</html>
  `;
  fs.writeFileSync(path.join(staticPath, 'index.html'), minimalHtml);
}

// Serve static files
app.use(express.static(staticPath));

// Serve additional static assets
const assetsDirs = [
  'public',
  'public/images',
  'assets',
  path.join(staticPath, 'assets')
];

assetsDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    app.use('/' + path.basename(dir), express.static(dir));
    console.log(`Serving assets from ${dir}`);
  }
});

// Start the API server
console.log('Starting API server...');
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: '5000' // API server runs on a different port
  }
});

serverProcess.on('error', (err) => {
  console.error('API server error:', err);
});

// For client-side routing, all non-API routes go to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    // Try to find index.html in various places
    const possibleLocations = [
      path.join(staticPath, 'index.html'),
      'client/index.html',
      'dist/index.html',
      'index.html'
    ];
    
    for (const location of possibleLocations) {
      if (fs.existsSync(location)) {
        return res.sendFile(path.resolve(location));
      }
    }
    
    // If index.html not found, send an error
    res.status(404).send('Frontend files not found');
  }
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
  console.log(`API server should be running on port 5000`);
});