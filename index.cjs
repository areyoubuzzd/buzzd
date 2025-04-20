/**
 * Combined server and client deployment launcher
 * This is the simplest possible approach for deployment
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Log startup information
console.log(`
========================================
 BUZZD DEPLOYMENT SERVER  
========================================
Environment: ${isProduction ? 'Production' : 'Development'}
Current directory: ${process.cwd()}
Files: ${fs.readdirSync('.').join(', ')}
Time: ${new Date().toISOString()}
========================================
`);

// First, try to start the server
console.log('🚀 Starting API server...');
const apiProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: '5000' // Run the API server on a different port
  }
});

apiProcess.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
});

// Serve static files from client if it exists
if (fs.existsSync('client/dist')) {
  console.log('Serving static files from client/dist');
  app.use(express.static('client/dist'));
} else if (fs.existsSync('client')) {
  console.log('Serving static files from client directory');
  app.use(express.static('client'));
} else {
  console.log('No client directory found');
}

// For client-side routing, send index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    // Look for index.html in various places
    const possibleIndexLocations = [
      path.join(__dirname, 'client/dist/index.html'),
      path.join(__dirname, 'client/index.html'),
      path.join(__dirname, 'dist/index.html'),
      path.join(__dirname, 'index.html'),
    ];
    
    // Try each location
    for (const indexPath of possibleIndexLocations) {
      if (fs.existsSync(indexPath)) {
        console.log(`Serving index.html from ${indexPath}`);
        return res.sendFile(indexPath);
      }
    }
    
    // If index.html wasn't found anywhere, send an error
    console.error('❌ index.html not found in any expected location');
    res.status(404).send(`
      <h1>Buzzd App</h1>
      <p>Error: index.html not found</p>
      <p>Check server logs for more information.</p>
    `);
  }
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server listening on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to access the application`);
});