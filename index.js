'use strict';

/**
 * Entry point for Replit deployment
 */

// This file uses CommonJS (require) syntax for maximum compatibility
const fs = require('fs');
const path = require('path');

// Log startup diagnostics
console.log('BUZZD DEPLOYMENT STARTING...');
console.log('Current directory:', process.cwd());
console.log('Available files:', fs.readdirSync('.').join(', '));

// Choose the appropriate server file to use
const serverOptions = [
  './final-server.cjs',   // Preferred option
  './server.cjs',         // Backup option
  './deploy.cjs',         // Another backup
  './index.cjs'           // Last resort
];

let serverFile = null;

// Find the first server file that exists
for (const option of serverOptions) {
  if (fs.existsSync(option)) {
    serverFile = option;
    console.log(`Found server file: ${option}`);
    break;
  }
}

if (!serverFile) {
  console.error('No server file found! Creating a simple one...');
  
  // Create a simple Express server as a fallback
  const express = require('express');
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  // Serve static files if they exist
  if (fs.existsSync('client')) {
    app.use(express.static('client'));
  }
  
  // Serve a simple message
  app.get('*', (req, res) => {
    res.send(`
      <h1>Buzzd App</h1>
      <p>No server file found. Please check your deployment configuration.</p>
      <p>Current directory: ${process.cwd()}</p>
      <p>Files: ${fs.readdirSync('.').join(', ')}</p>
    `);
  });
  
  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Emergency fallback server running on port ${PORT}`);
  });
} else {
  // Load and run the selected server file
  console.log(`Loading server from ${serverFile}...`);
  try {
    require(serverFile);
  } catch (error) {
    console.error(`Error loading server from ${serverFile}:`, error);
  }
}