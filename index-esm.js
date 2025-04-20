/**
 * Entry point for Replit deployment (ES Module version)
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import { spawn } from 'child_process';

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log startup diagnostics
console.log('BUZZD DEPLOYMENT STARTING (ESM VERSION)...');
console.log('Current directory:', process.cwd());
console.log('Available files:', fs.readdirSync('.').join(', '));

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

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
} else {
  console.log('No static file directory found!');
  fs.mkdirSync('client', { recursive: true });
  staticPath = 'client';
}

// Serve static files
app.use(express.static(staticPath));

// Serve additional static assets
const assetsDirs = [
  'public',
  'public/images',
  'assets',
  path.join(staticPath, 'assets')
];

assetsDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    app.use('/' + path.basename(dir), express.static(dir));
    console.log(`Serving assets from ${dir}`);
  }
});

// Start the API server
console.log('Starting API server...');
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: '5000' // API server runs on a different port
  }
});

serverProcess.on('error', (err) => {
  console.error('API server error:', err);
});

// For client-side routing, all non-API routes go to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    // Try to find index.html in various places
    const possibleLocations = [
      path.join(staticPath, 'index.html'),
      'client/index.html',
      'dist/index.html',
      'index.html'
    ];
    
    for (const location of possibleLocations) {
      if (fs.existsSync(location)) {
        return res.sendFile(path.resolve(location));
      }
    }
    
    // If index.html not found, send an error
    res.status(404).send('Frontend files not found');
  }
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
  console.log(`API server should be running on port 5000`);
});