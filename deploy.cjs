/**
 * Simple Replit Deployment Entry Point
 * This file handles the deployment of your application.
 */

// Load the express module
const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Create the app
const app = express();
const PORT = process.env.PORT || 3000;

// Log startup information
console.log('Starting deployment server on port', PORT);
console.log('Current directory:', __dirname);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Start API server
console.log('Starting API server...');
exec('npx tsx server/index.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`API Server Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`API Server stderr: ${stderr}`);
    return;
  }
  console.log(`API Server stdout: ${stdout}`);
});

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Handle client-side routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(__dirname, 'client/index.html');
    
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    } else {
      return res.status(404).send(`
        <html>
          <head><title>Buzzd App</title></head>
          <body>
            <h1>File Not Found</h1>
            <p>The application files could not be located.</p>
            <p>Path checked: ${indexPath}</p>
            <p>Current directory: ${__dirname}</p>
            <p>Files in current directory: ${fs.readdirSync(__dirname).join(', ')}</p>
          </body>
        </html>
      `);
    }
  }
  
  // If it's an API route, pass it through
  res.status(404).send('API Not Found');
});

// Start Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});