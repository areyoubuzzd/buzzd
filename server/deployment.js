/**
 * Deployment Server Entry Point
 * 
 * This file is used for the production deployment.
 * It sets up proper port binding and handles environment variables.
 */

// Import required modules
const express = require('express');
const path = require('path');
const { execSync } = require('child_process');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Log environment information
console.log("Starting deployment server...");
console.log(`Using port: ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));
app.use('/assets', express.static(path.join(__dirname, '../client/assets')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Handle all requests that should be routed to the main application
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    // Forward API requests to the main server
    res.status(500).send('API not running properly');
  } else {
    // Serve index.html for client-side routing
    res.sendFile(path.join(__dirname, '../client/index.html'));
  }
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Deployment server running on http://0.0.0.0:${PORT}`);
  
  // Start the main application server
  try {
    console.log("Starting main application server...");
    // Use require instead of direct execution to keep this process active
    require('./index');
  } catch (error) {
    console.error("Failed to start main application server:", error);
  }
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log("Shutting down deployment server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

module.exports = app;