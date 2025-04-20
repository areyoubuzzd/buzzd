/**
 * Deployment Startup Script for Replit
 * 
 * This script starts both the server and client for deployment,
 * ensuring that the app is accessible via HTTP.
 */

const { spawn } = require('child_process');
const http = require('http');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create a simple HTTP server to keep the app alive and serve static files
const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting deployment server on port', PORT);

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));

// Serve assets directory
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));

// All routes not starting with /api should serve the index.html for client-side routing
app.get('*', (req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'client/index.html'));
  }
  next();
});

// Start the Express server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server listening on port ${PORT}`);
});

// Start the main application server
console.log('Starting main application server via npm...');
const npmProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

npmProcess.on('error', (error) => {
  console.error('Failed to start npm process:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down...');
  server.close();
  if (npmProcess) {
    npmProcess.kill('SIGINT');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down...');
  server.close();
  if (npmProcess) {
    npmProcess.kill('SIGTERM');
  }
  process.exit(0);
});