/**
 * Alternative Deployment Entry Point for Buzzd
 * 
 * This file is another option for deployment if index.js doesn't work.
 * It's essentially the same but with a different name that might bypass
 * any Replit conventions.
 */

// Import with CommonJS syntax to ensure maximum compatibility
const express = require('express');
const path = require('path');
const { exec } = require('child_process');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Log environment information
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Starting Buzzd application from run.js...');
console.log('Current directory:', __dirname);
console.log('Files in current directory:', require('fs').readdirSync(__dirname));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Start the server application
let serverCommand = 'npx tsx server/index.ts';
console.log('Starting server with command:', serverCommand);

const serverProcess = exec(serverCommand);
serverProcess.stdout.on('data', (data) => console.log(`[SERVER]: ${data}`));
serverProcess.stderr.on('data', (data) => console.error(`[SERVER ERROR]: ${data}`));

// Handle server exit
serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  if (code !== 0) {
    console.log('Attempting to restart server...');
    exec(serverCommand);
  }
});

// For client-side routing - all routes that don't start with /api go to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'client/index.html'));
  }
  // Let the server process handle API requests
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Static file server listening on port ${PORT}`);
  console.log('Ready for deployment!');
});