/**
 * Cache-Busting Utility for Replit Deployments
 * 
 * This script addresses file hash mismatches between development/preview and deployment
 * by creating a hard copy of the JS file with a consistent name.
 * 
 * Usage: node bust-cache.js
 */

import fs from 'fs';
import path from 'path';

// Bold colors for visibility
const RED = '\x1b[1;31m';
const GREEN = '\x1b[1;32m';
const YELLOW = '\x1b[1;33m';
const BLUE = '\x1b[1;34m';
const RESET = '\x1b[0m';

// Log with color
const log = (text, color = RESET) => console.log(`${color}${text}${RESET}`);

log("🛠️  CACHE BUSTING UTILITY 🛠️", BLUE);
log("This tool creates stable file references for Replit deployment", YELLOW);
log("---------------------------------------------------------------", BLUE);

// Key directories
const distDir = path.join(process.cwd(), "dist");
const publicDir = path.join(distDir, "public");
const assetsDir = path.join(publicDir, "assets");

// First verify the dist directory exists
if (!fs.existsSync(publicDir)) {
  log("❌ Public directory not found. Run 'npm run build' first.", RED);
  process.exit(1);
}

if (!fs.existsSync(assetsDir)) {
  log("❌ Assets directory not found. Something is wrong with the build.", RED);
  process.exit(1);
}

// Find index.html
const indexHtmlPath = path.join(publicDir, "index.html");
if (!fs.existsSync(indexHtmlPath)) {
  log("❌ index.html not found. Something is wrong with the build.", RED);
  process.exit(1);
}

// Read the HTML file
let html = fs.readFileSync(indexHtmlPath, 'utf8');
log("📄 Found index.html", GREEN);

// Find the JS file reference
const jsMatch = html.match(/src="\/assets\/(index-[^"]+\.js)"/);
if (!jsMatch) {
  log("❌ Could not find JS file reference in index.html", RED);
  process.exit(1);
}

const originalJsFilename = jsMatch[1];
const stableJsFilename = "index-stable.js";
const originalJsPath = path.join(assetsDir, originalJsFilename);
const stableJsPath = path.join(assetsDir, stableJsFilename);

log(`📝 JS file identified: ${originalJsFilename}`, GREEN);

// Find the CSS file reference
const cssMatch = html.match(/href="\/assets\/(index-[^"]+\.css)"/);
if (!cssMatch) {
  log("❌ Could not find CSS file reference in index.html", RED);
  process.exit(1);
}

const originalCssFilename = cssMatch[1];
const stableCssFilename = "index-stable.css";
const originalCssPath = path.join(assetsDir, originalCssFilename);
const stableCssPath = path.join(assetsDir, stableCssFilename);

log(`📝 CSS file identified: ${originalCssFilename}`, GREEN);

// Create stable copies of files
try {
  // Copy JS file
  fs.copyFileSync(originalJsPath, stableJsPath);
  log(`✅ Created stable JS file: ${stableJsFilename}`, GREEN);
  
  // Copy CSS file
  fs.copyFileSync(originalCssPath, stableCssPath);
  log(`✅ Created stable CSS file: ${stableCssFilename}`, GREEN);
  
  // Update index.html to reference stable files
  html = html.replace(`/assets/${originalJsFilename}`, `/assets/${stableJsFilename}`);
  html = html.replace(`/assets/${originalCssFilename}`, `/assets/${stableCssFilename}`);
  
  fs.writeFileSync(indexHtmlPath, html);
  log("✅ Updated index.html to use stable filenames", GREEN);
  
  log("\n✨ CACHE BUSTING COMPLETE ✨", GREEN);
  log("Your application is now ready for deployment.", YELLOW);
  
} catch (error) {
  log(`❌ Error creating stable files: ${error.message}`, RED);
  process.exit(1);
}

// Check if files exist in the target directory
const directoryHasFiles = fs.readdirSync(assetsDir).some(file => 
  file === stableJsFilename || file === stableCssFilename
);

if (!directoryHasFiles) {
  log("⚠️ Warning: Could not verify that stable files were created.", YELLOW);
  log("Please check the assets directory manually.", YELLOW);
} else {
  // Print the updated HTML to verify
  log("\n📄 Updated index.html now contains:", BLUE);
  log(`script src="/assets/${stableJsFilename}"`, GREEN);
  log(`link href="/assets/${stableCssFilename}"`, GREEN);
}