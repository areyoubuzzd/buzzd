/**
 * Direct Mirror of Preview Environment for Production Deployment
 * 
 * This script exactly replicates the preview environment setup,
 * using the exact same configuration that's working in preview.
 */

// Use CommonJS requires for compatibility with both ESM and CJS
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log(`
=================================================
  DIRECT MIRROR OF PREVIEW ENVIRONMENT
=================================================
Started at: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'production'}
Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}
=================================================
`);

// Check for critical environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  console.error('This must be provided in deployment secrets.');
  process.exit(1);
}

// Start the server using exactly the same command as the workflow
console.log('Starting server using the same configuration as preview...');

// Use the same command as in the workflow: "npm run dev"
// This will run "tsx server/index.ts" as defined in package.json
const serverProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: process.env.PORT || '3000' // Make sure to use the provided PORT
  }
});

// Handle server process events
serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
});

serverProcess.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code} and signal ${signal}`);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  serverProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  serverProcess.kill();
  process.exit(0);
});