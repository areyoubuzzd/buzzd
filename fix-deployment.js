/**
 * Special Deployment Fix for Replit
 * 
 * This script forces a clean build before deployment and directly
 * modifies the HTML file to use a stable reference.
 * 
 * Usage: node fix-deployment.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clean build folder
console.log("🧹 Cleaning previous builds...");
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  execSync('rm -rf dist');
}

// Run build
console.log("🔨 Building application...");
execSync('NODE_ENV=production npm run build', { stdio: 'inherit' });

// Verify files
const indexHtmlPath = path.join(__dirname, 'dist', 'public', 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error("❌ Build failed - index.html not found");
  process.exit(1);
}

// Read the HTML file
console.log("📝 Modifying index.html...");
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Find JS and CSS assets
const jsMatch = html.match(/src="\/assets\/(index-[^"]+\.js)"/);
const cssMatch = html.match(/href="\/assets\/(index-[^"]+\.css)"/);

if (!jsMatch || !cssMatch) {
  console.error("❌ Could not find asset references in index.html");
  process.exit(1);
}

// Get the current filenames
const jsFilename = jsMatch[1];
const cssFilename = cssMatch[1];

console.log(`Found JS: ${jsFilename}`);
console.log(`Found CSS: ${cssFilename}`);

// Get absolute paths
const jsPath = path.join(__dirname, 'dist', 'public', 'assets', jsFilename);
const cssPath = path.join(__dirname, 'dist', 'public', 'assets', cssFilename);

// Create app.js and app.css
const appJsPath = path.join(__dirname, 'dist', 'public', 'assets', 'app.js');
const appCssPath = path.join(__dirname, 'dist', 'public', 'assets', 'app.css');

// Copy files
fs.copyFileSync(jsPath, appJsPath);
fs.copyFileSync(cssPath, appCssPath);

// Update HTML
html = html.replace(`/assets/${jsFilename}`, '/assets/app.js');
html = html.replace(`/assets/${cssFilename}`, '/assets/app.css');

// Write updated HTML
fs.writeFileSync(indexHtmlPath, html);

console.log("✅ Successfully fixed build for deployment!");
console.log("You can now deploy the application from Replit.");
