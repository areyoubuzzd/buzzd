/**
 * Ultimate Final Deployment Fix for Buzzd App
 * Simple, guaranteed-to-work approach
 */

// Import using CommonJS to ensure compatibility
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Print diagnostic information
console.log('----- DEPLOYMENT SERVER DIAGNOSTICS -----');
console.log('Current directory:', __dirname);
console.log('Directory contents:', fs.readdirSync(__dirname).join(', '));
if (fs.existsSync(path.join(__dirname, 'client'))) {
  console.log('Client directory exists');
  console.log('Client directory contents:', fs.readdirSync(path.join(__dirname, 'client')).join(', '));
} else {
  console.log('Client directory does NOT exist!');
}
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('----------------------------------------');

// Setup middleware for serving static files
app.use(express.static(path.join(__dirname, 'client')));
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Start the application server
console.log('Starting application server...');
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'pipe',
  shell: true
});

// Pipe server process output to console
serverProcess.stdout.on('data', (data) => {
  process.stdout.write(`[SERVER]: ${data}`);
});

serverProcess.stderr.on('data', (data) => {
  process.stderr.write(`[SERVER ERROR]: ${data}`);
});

// Handle server exit
serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Client-side routing - send all non-API requests to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    console.log(`Serving index.html for path: ${req.path}`);
    
    // First check if the file exists to avoid errors
    const indexPath = path.join(__dirname, 'client/index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // If index.html doesn't exist, create a simple HTML response
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Buzzd App</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #e74c3c; margin: 20px 0; }
            .info { color: #3498db; margin: 20px 0; }
            pre { text-align: left; background: #f8f9fa; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Buzzd Application</h1>
          <div class="error">
            <p>The application files could not be found.</p>
            <p>This could be due to a deployment configuration issue.</p>
          </div>
          <div class="info">
            <p>Server is running at: ${req.protocol}://${req.get('host')}</p>
            <p>Requested path: ${req.path}</p>
          </div>
          <pre>
Server diagnostics:
- Current directory: ${__dirname}
- Client directory exists: ${fs.existsSync(path.join(__dirname, 'client'))}
- NODE_ENV: ${process.env.NODE_ENV || 'not set'}
          </pre>
        </body>
        </html>
      `);
    }
  } else {
    // Let the API server handle API requests
    res.status(404).send('API endpoint not found');
  }
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server listening on port ${PORT}`);
});