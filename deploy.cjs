/**
 * Simple deployment server for Buzzd App
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

console.log(`
=================================================
  BUZZD DEPLOYMENT SERVER
=================================================
- Starting at: ${new Date().toISOString()}
- Current directory: ${process.cwd()}
- Available files: ${fs.readdirSync('.').join(', ')}
=================================================
`);

// Determine where to serve static files from (with fallbacks)
let staticDir = null;
if (fs.existsSync('client/dist')) {
  staticDir = 'client/dist';
  console.log('Using client/dist for static files');
} else if (fs.existsSync('dist')) {
  staticDir = 'dist';
  console.log('Using dist for static files');
} else if (fs.existsSync('client')) {
  staticDir = 'client';
  console.log('Using client directory for static files');
} else {
  console.log('No static file directory found!');
}

// If we have a static directory, serve files from it
if (staticDir) {
  app.use(express.static(staticDir));
  
  // Additional static paths
  const assetsPaths = [
    path.join(staticDir, 'assets'),
    'public',
    'public/images',
    'assets'
  ];
  
  assetsPaths.forEach(assetsPath => {
    if (fs.existsSync(assetsPath)) {
      app.use('/' + path.basename(assetsPath), express.static(assetsPath));
      console.log(`Serving assets from ${assetsPath}`);
    }
  });
}

// Start the API server
console.log('Starting API server...');
let apiServer;
if (fs.existsSync('dist/index.js')) {
  console.log('Using compiled server from dist/index.js');
  apiServer = fork('dist/index.js', [], {
    env: { ...process.env, PORT: '5000' },
    stdio: 'inherit'
  });
} else {
  console.log('Using TypeScript server with tsx');
  apiServer = fork('server/index.ts', [], {
    execPath: 'npx',
    execArgv: ['tsx'],
    env: { ...process.env, PORT: '5000' },
    stdio: 'inherit'
  });
}

apiServer.on('error', (err) => {
  console.error('API server error:', err);
});

// Create fallback index.html if needed
if (staticDir && !fs.existsSync(path.join(staticDir, 'index.html'))) {
  console.log('Creating fallback index.html');
  const fallbackHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buzzd - Happy Hour Deals</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { color: #e63946; }
  </style>
</head>
<body>
  <div id="root">
    <h1>Buzzd</h1>
    <p>Looking for happy hour deals in Singapore?</p>
    <p>Please check deployment configuration. Frontend files could not be located.</p>
  </div>
</body>
</html>
  `;
  fs.writeFileSync(path.join(staticDir, 'index.html'), fallbackHtml);
}

// Serve index.html for all client-side routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    // Try to find index.html in various locations
    const indexLocations = [
      staticDir ? path.join(staticDir, 'index.html') : null,
      'client/index.html',
      'dist/index.html',
      'index.html'
    ].filter(Boolean);
    
    for (const location of indexLocations) {
      if (fs.existsSync(location)) {
        return res.sendFile(path.resolve(location));
      }
    }
    
    // If no index.html was found, send a simple message
    res.status(404).send(`
      <h1>Buzzd App</h1>
      <p>Frontend files not found. Please check deployment configuration.</p>
    `);
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Deployment server running on port ${PORT}`);
});