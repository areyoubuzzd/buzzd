/**
 * Direct deployment server for Buzzd App
 * Ultra simple approach that uses direct file copying
 */

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer } from 'http';
import fs from 'fs';
import { spawn } from 'child_process';

// Get directory names in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Log diagnostic information
console.log('🚀 Starting Buzzd deployment server');
console.log('Current directory:', __dirname);
console.log('Files in current directory:', fs.readdirSync(__dirname));

// Start the API server separately
console.log('Starting API server...');
const apiProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit', 
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

apiProcess.on('error', (err) => {
  console.error('Failed to start API server:', err);
});

// Setup client files serving
app.use(express.static(path.join(__dirname, 'client')));
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Redirect all non-API requests to index.html for client-side routing
app.get('*', (req, res, next) => {
  if (!req.path.startsWith('/api')) {
    try {
      return res.sendFile(path.join(__dirname, 'client/index.html'));
    } catch (err) {
      console.error('Error serving index.html:', err);
      next(err);
    }
  } else {
    // API requests should be handled by the API server
    next();
  }
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`API server should be running on port 5000`);
});