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

const DIST_DIR = './dist';
const PUBLIC_DIR = path.join(DIST_DIR, 'public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const INDEX_HTML_PATH = path.join(PUBLIC_DIR, 'index.html');

console.log('🔍 Starting cache-busting process...');

// Check if dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Error: dist directory not found. Run the build first.');
  process.exit(1);
}

// Check if index.html exists
if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('❌ Error: index.html not found. Run the build first.');
  process.exit(1);
}

// Read index.html
let indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

// Extract JS and CSS file references
const jsMatch = indexHtml.match(/src="\/assets\/(index-[^"]+\.js)"/);
const cssMatch = indexHtml.match(/href="\/assets\/(index-[^"]+\.css)"/);

if (!jsMatch) {
  console.error('❌ Error: JS file reference not found in index.html');
  process.exit(1);
}

if (!cssMatch) {
  console.error('❌ Error: CSS file reference not found in index.html');
  process.exit(1);
}

const jsFile = jsMatch[1];
const cssFile = cssMatch[1];

console.log(`🔍 Found JS file: ${jsFile}`);
console.log(`🔍 Found CSS file: ${cssFile}`);

// Create a non-hashed version of the JS file
const jsPath = path.join(ASSETS_DIR, jsFile);
const stableJsPath = path.join(ASSETS_DIR, 'index-stable.js');

// Create a non-hashed version of the CSS file
const cssPath = path.join(ASSETS_DIR, cssFile);
const stableCssPath = path.join(ASSETS_DIR, 'index-stable.css');

try {
  // Copy JS file
  fs.copyFileSync(jsPath, stableJsPath);
  console.log(`✅ Created stable JS file: assets/index-stable.js`);
  
  // Copy CSS file
  fs.copyFileSync(cssPath, stableCssPath);
  console.log(`✅ Created stable CSS file: assets/index-stable.css`);
  
  // Update references in index.html
  indexHtml = indexHtml.replace(
    `src="/assets/${jsFile}"`,
    `src="/assets/index-stable.js"`
  );
  
  indexHtml = indexHtml.replace(
    `href="/assets/${cssFile}"`,
    `href="/assets/index-stable.css"`
  );
  
  // Write updated index.html
  fs.writeFileSync(INDEX_HTML_PATH, indexHtml);
  console.log(`✅ Updated index.html with stable file references`);
  
  console.log('\n🚀 Cache-busting process completed successfully!');
  console.log('Your app is now ready for deployment with stable file references.');
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}