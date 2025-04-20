/**
 * Simple production server for Buzzd app (ES Module version)
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Log environment information
console.log(`
===========================================
  BUZZD PRODUCTION SERVER (ESM)
===========================================
NODE_ENV: ${process.env.NODE_ENV || 'not set'}
Current directory: ${process.cwd()}
Node version: ${process.version}
Time: ${new Date().toISOString()}
===========================================
`);

// Determine where to serve static files from
let staticPath = '';
if (fs.existsSync('client/dist')) {
  staticPath = 'client/dist';
  console.log('Using client/dist for static files');
} else if (fs.existsSync('dist')) {
  staticPath = 'dist';
  console.log('Using dist for static files');
} else if (fs.existsSync('client')) {
  staticPath = 'client';
  console.log('Using client directory for static files');
} 

// Print info about what's in the directories
console.log('Files in current directory:', fs.readdirSync('.').join(', '));
if (staticPath) {
  console.log(`Files in ${staticPath}:`, fs.readdirSync(staticPath).join(', '));
}

// Serve static files if we have a path
if (staticPath) {
  app.use(express.static(staticPath));
  
  // Additional asset paths
  ['public', 'assets', path.join(staticPath, 'assets')].forEach(dir => {
    if (fs.existsSync(dir)) {
      app.use('/' + path.basename(dir), express.static(dir));
      console.log(`Serving assets from ${dir}`);
    }
  });
}

// Start the API server
console.log('Starting API server...');
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

serverProcess.on('error', (err) => {
  console.error('Failed to start API server:', err);
});

// For client-side routing, all non-API routes go to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    // Look for index.html in various places
    const indexLocations = [
      staticPath ? path.join(staticPath, 'index.html') : null,
      'client/index.html',
      'dist/index.html',
      'index.html'
    ].filter(Boolean);
    
    for (const location of indexLocations) {
      if (fs.existsSync(location)) {
        return res.sendFile(path.resolve(location));
      }
    }
    
    // If index.html wasn't found, send a basic message
    res.status(404).send(`
      <h1>Buzzd App</h1>
      <p>Error: Could not find frontend files</p>
      <p>Looked in: ${indexLocations.join(', ')}</p>
    `);
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});