/**
 * Ultra-minimal production server for Buzzd app
 * No proxy, no fancy stuff - just direct execution
 */

// Use regular require for maximum compatibility
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('client/dist'));

// Direct health check endpoint
app.get('/api/servercheck', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'ultra-simple-server',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'not configured'
    }
  });
});

// Skip proxy altogether and just run the main app directly
console.log(`
=================================================
  ULTRA-SIMPLE SERVER STARTING UP
=================================================
NODE_ENV: ${process.env.NODE_ENV || 'not set'}
DATABASE_URL: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}
PORT: ${PORT}
=================================================
`);

// Start by cleaning up any possible running server
exec('pkill -f "tsx server/index.ts" || true', (error) => {
  if (error) {
    console.log('No existing server found to clean up');
  } else {
    console.log('Cleaned up any existing server processes');
  }
  
  // Now directly run the development server
  const serverProcess = exec('tsx server/index.ts', {
    env: {
      ...process.env,
      PORT: PORT // Use the same port for simplicity
    }
  });
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data.trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data.trim()}`);
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
});

// For frontend routing - serve index.html for all non-matched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Only start listening if we're the main module (not imported)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  exec('pkill -f "tsx server/index.ts" || true');
  process.exit(0);
});