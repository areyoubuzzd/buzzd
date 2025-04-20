/**
 * Restore Development Environment Script
 * 
 * This script restores the original index.html file after deploying.
 * Run this after deploying your application to restore development functionality.
 * 
 * Using .cjs extension to force CommonJS mode
 */

const fs = require('fs');

console.log("🔄 Restoring development environment...");

try {
  if (fs.existsSync('client/index.html.dev')) {
    fs.copyFileSync('client/index.html.dev', 'client/index.html');
    fs.unlinkSync('client/index.html.dev');
    console.log("✅ Successfully restored development index.html");
  } else {
    console.log("⚠️ No backup found, cannot restore development index.html");
  }
} catch (e) {
  console.error("❌ Error restoring development environment:", e);
}