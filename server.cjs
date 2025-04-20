/**
 * Production server for Buzzd app
 * This script:
 * 1. Starts a server to serve the React frontend
 * 2. Serves the API for backend functionality
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Create app and set port
const app = express();
const PORT = process.env.PORT || 3000;

// Log environment information
console.log(`
===========================================
  BUZZD PRODUCTION SERVER
===========================================
NODE_ENV: ${process.env.NODE_ENV || 'not set'}
Current directory: ${process.cwd()}
Node version: ${process.version}
Time: ${new Date().toISOString()}
===========================================
`);

// Ensure there's a client directory
if (!fs.existsSync('client')) {
  console.log('⚠️ Client directory not found, creating it...');
  fs.mkdirSync('client', { recursive: true });
}

// If client/dist doesn't exist but client does, copy the build output
if (!fs.existsSync('client/dist') && fs.existsSync('dist')) {
  console.log('⚠️ client/dist not found but dist exists, copying files...');
  fs.mkdirSync('client/dist', { recursive: true });
  const files = fs.readdirSync('dist');
  files.forEach(file => {
    const sourcePath = path.join('dist', file);
    const destPath = path.join('client/dist', file);
    if (fs.lstatSync(sourcePath).isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      const subFiles = fs.readdirSync(sourcePath);
      subFiles.forEach(subFile => {
        fs.copyFileSync(
          path.join(sourcePath, subFile), 
          path.join(destPath, subFile)
        );
      });
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
  console.log('✅ Files copied successfully');
}

// Start the API server
console.log('Starting API server...');
const apiProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

apiProcess.on('error', (err) => {
  console.error('Failed to start API server:', err);
});

// Serve static files
if (fs.existsSync('client/dist')) {
  console.log('Serving static files from client/dist');
  app.use(express.static('client/dist'));
} else if (fs.existsSync('client')) {
  console.log('Serving static files from client');
  app.use(express.static('client'));
} else {
  console.log('No client directory found, creating minimal frontend');
  const minimalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buzzd - Happy Hour Deals</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
    }
    h1 {
      color: #e63946;
    }
  </style>
</head>
<body>
  <div id="root">
    <h1>Buzzd</h1>
    <p>The Singapore Happy Hour Deals App</p>
    <p>Frontend resources are missing. Please check the deployment configuration.</p>
  </div>
</body>
</html>
  `;
  fs.mkdirSync('client', { recursive: true });
  fs.writeFileSync('client/index.html', minimalHtml);
  app.use(express.static('client'));
}

// Handle client-side routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    // Try to find index.html in various locations
    const possiblePaths = [
      path.join(__dirname, 'client/dist/index.html'),
      path.join(__dirname, 'client/index.html'),
      path.join(__dirname, 'dist/index.html')
    ];
    
    for (const indexPath of possiblePaths) {
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    
    // If we couldn't find index.html, return an error
    res.status(404).send('Could not find frontend resources');
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the app`);
});