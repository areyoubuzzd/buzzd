/**
 * Special Pre-Deployment Script for Replit
 * 
 * This script forces a clean build before deployment and verifies
 * the hash consistency between the HTML and generated assets.
 * 
 * Usage: 
 * 1. Run this script: node pre-deploy.js
 * 2. Then use Replit's deployment interface
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Bold colors for visibility
const RED = '\x1b[1;31m';
const GREEN = '\x1b[1;32m';
const YELLOW = '\x1b[1;33m';
const BLUE = '\x1b[1;34m';
const CYAN = '\x1b[1;36m';
const RESET = '\x1b[0m';

// Log with color
const log = (text, color = RESET) => console.log(`${color}${text}${RESET}`);

log("🚀 PRE-DEPLOYMENT UTILITY 🚀", BLUE);
log("This tool prepares your app for deployment on Replit", YELLOW);
log("---------------------------------------------------------------", BLUE);

// Step 1: Clean the build to start fresh
log("\n1️⃣ Cleaning previous builds...", CYAN);
try {
  if (fs.existsSync('./dist')) {
    execSync('rm -rf ./dist');
    log("✅ Removed old dist directory", GREEN);
  } else {
    log("ℹ️ No previous dist directory found", YELLOW);
  }
} catch (error) {
  log(`❌ Error cleaning build: ${error.message}`, RED);
  process.exit(1);
}

// Step 2: Run the production build
log("\n2️⃣ Running production build...", CYAN);
try {
  // Production build
  execSync('NODE_ENV=production npm run build', { stdio: 'inherit' });
  
  if (!fs.existsSync('./dist/public')) {
    log("❌ Build failed - dist directory not found", RED);
    process.exit(1);
  }
  
  log("✅ Production build completed successfully", GREEN);
} catch (error) {
  log(`❌ Build failed: ${error.message}`, RED);
  process.exit(1);
}

// Step 3: Run the cache-busting utility
log("\n3️⃣ Applying cache-busting fix...", CYAN);
try {
  execSync('node bust-cache.js', { stdio: 'inherit' });
  log("✅ Cache-busting applied successfully", GREEN);
} catch (error) {
  log(`❌ Cache-busting failed: ${error.message}`, RED);
  process.exit(1);
}

// Step 4: Verify the files are ready for deployment
log("\n4️⃣ Verifying deployment readiness...", CYAN);

const publicDir = path.join("dist", "public");
const assetsDir = path.join(publicDir, "assets");
const indexHtmlPath = path.join(publicDir, "index.html");

if (!fs.existsSync(indexHtmlPath)) {
  log("❌ index.html not found!", RED);
  process.exit(1);
}

const stableJsPath = path.join(assetsDir, "index-stable.js");
const stableCssPath = path.join(assetsDir, "index-stable.css");

if (!fs.existsSync(stableJsPath)) {
  log("❌ Stable JS file not found!", RED);
  process.exit(1);
}

if (!fs.existsSync(stableCssPath)) {
  log("❌ Stable CSS file not found!", RED);
  process.exit(1);
}

const html = fs.readFileSync(indexHtmlPath, 'utf8');
if (!html.includes('index-stable.js') || !html.includes('index-stable.css')) {
  log("❌ index.html does not reference stable files!", RED);
  process.exit(1);
}

log("✅ All deployment files verified", GREEN);

// Final message
log("\n🌟 DEPLOYMENT PREPARATION COMPLETE 🌟", GREEN);
log("Your application is now ready for deployment.", YELLOW);
log("\nNext steps:", CYAN);
log("1. Click the 'Deploy' button in Replit", YELLOW);
log("2. Use the default deployment settings", YELLOW);
log("3. Your application should deploy successfully with fixed asset references", YELLOW);