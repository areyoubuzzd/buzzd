// Ultra-simple deployment server
const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure we're using CommonJS despite package.json type:module
console.log('Starting Buzzd deployment server...');
console.log('Current directory contents:', fs.readdirSync('.'));

// Serve static files
console.log('Setting up static file serving from client directory');
app.use(express.static(path.join(__dirname, 'client')));
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// For client-side routing - all non-API routes go to index.html
app.get('*', (req, res, next) => {
  if (!req.path.startsWith('/api')) {
    console.log('Serving client app for path:', req.path);
    return res.sendFile(path.join(__dirname, 'client/index.html'));
  }
  next();
});

// Start Express server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Deployment server listening on port ${PORT}`);
  
  try {
    // Build the app
    console.log('Building the application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Start the API server
    console.log('Starting API server...');
    // We use exec here to avoid blocking the main process
    require('./dist/index.js');
    console.log('API server started successfully');
  } catch (error) {
    console.error('Error starting the application:', error);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});