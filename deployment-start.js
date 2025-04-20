/**
 * Deployment Entry Point
 * 
 * This is the main entry point for the deployed application.
 */

// Start the server
console.log("Starting deployment server...");
require('./server/index.js');

// Listen for shutdown signals
process.on('SIGINT', () => {
  console.log("Received SIGINT signal. Shutting down...");
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log("Received SIGTERM signal. Shutting down...");
  process.exit(0);
});

console.log("Deployment server started. Application is ready to receive traffic.");