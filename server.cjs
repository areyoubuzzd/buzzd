/**
 * Ultra-simple deployment server for Buzzd App (CommonJS version)
 */

const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Log setup info
console.log('Starting Buzzd deployment server (CommonJS)...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', __dirname);
console.log('Files in current directory:', fs.readdirSync(__dirname));

// Ensure the client directory exists
if (!fs.existsSync(path.join(__dirname, 'client'))) {
  console.error('ERROR: client directory not found!');
  console.log('Contents of current directory:', fs.readdirSync(__dirname));
} else {
  console.log('Client directory exists. Contents:', fs.readdirSync(path.join(__dirname, 'client')));
}

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Start the server application in a child process
console.log('Starting the API server process...');
let serverCommand = 'npx tsx server/index.ts';
const serverProcess = spawn(serverCommand, [], { shell: true });

serverProcess.stdout.on('data', (data) => {
  console.log(`[API Server]: ${data}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[API Server Error]: ${data}`);
});

serverProcess.on('close', (code) => {
  console.log(`API Server process exited with code ${code}`);
  if (code !== 0) {
    console.log('Attempting to restart API server...');
    spawn(serverCommand, [], { shell: true });
  }
});

// For client-side routing - all routes that don't start with /api go to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    console.log('Serving client app for path:', req.path);
    try {
      const indexPath = path.join(__dirname, 'client/index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      } else {
        return res.status(404).send('Client index.html not found');
      }
    } catch (error) {
      console.error('Error serving index.html:', error);
      return res.status(500).send('Server error');
    }
  }
  // Pass through for API requests
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Static file server listening on port ${PORT}`);
  console.log(`Application should be accessible at http://localhost:${PORT}`);
});