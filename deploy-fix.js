/**
 * Ultra-Simple Deployment Fix for Replit
 * 
 * This script creates a server.js file that will be used
 * as the main entry point for deployment.
 */

const fs = require('fs');
const path = require('path');

console.log("🔧 Creating deployment server...");

// Create a specialized server.js for production deployment
const serverCode = `
// Deployment server for Buzzd App
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// For client-side routing - all routes that don't start with /api go to index.html
app.get('*', (req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'client/index.html'));
  }
  next();
});

// Start server
const httpServer = app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Express server listening on port \${PORT}\`);
  
  // Start the main application server in a child process
  console.log('Starting main application server...');
  const serverProcess = spawn('node', ['-r', 'tsx/register', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (error) => {
    console.error('Failed to start server process:', error);
  });
  
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    if (serverProcess) serverProcess.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('Shutting down...');
    if (serverProcess) serverProcess.kill();
    process.exit(0);
  });
});

// Export for potential testing
module.exports = { app, httpServer };
`;

// Write the server.js file
fs.writeFileSync('server.js', serverCode);
console.log("✅ Created server.js for deployment");

// Create a simple index.js file that loads our server
const indexCode = `
// Main entry point for deployment
require('./server.js');
`;

fs.writeFileSync('index.js', indexCode);
console.log("✅ Created index.js for deployment");

console.log("\n🚀 DEPLOYMENT INSTRUCTIONS:");
console.log("1. Deploy your app using Replit's deploy button");
console.log("2. Once deployed, your app should be accessible externally");
console.log("\nThe deployment will use the created server.js as an entry point");