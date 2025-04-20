/**
 * Super Simple Deployment Fix
 * 
 * This script:
 * 1. Cleans the dist directory
 * 2. Builds the app
 * 3. Takes the resulting files and creates fixed copies with stable names
 * 
 * Just run: node simple-fix.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("🔧 SUPER SIMPLE DEPLOYMENT FIX 🔧");

// Step 1: Clean previous builds
console.log("Step 1: Cleaning old builds...");
if (fs.existsSync('dist')) {
  execSync('rm -rf dist');
}

// Step 2: Run a fresh build
console.log("Step 2: Running new build...");
try {
  execSync('NODE_ENV=production npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
}

// Step 3: Update the dist index.html file with stable references
console.log("Step 3: Creating stable asset files...");

// Find the JS and CSS files
const assets = fs.readdirSync('dist/public/assets');
const jsFile = assets.find(file => file.startsWith('index-') && file.endsWith('.js'));
const cssFile = assets.find(file => file.startsWith('index-') && file.endsWith('.css'));

if (!jsFile || !cssFile) {
  console.error("Could not find asset files in the build output");
  process.exit(1);
}

// Create stable copies
fs.copyFileSync(`dist/public/assets/${jsFile}`, 'dist/public/assets/app.js');
fs.copyFileSync(`dist/public/assets/${cssFile}`, 'dist/public/assets/app.css');

// Update index.html
const indexPath = 'dist/public/index.html';
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(`/assets/${jsFile}`, '/assets/app.js');
html = html.replace(`/assets/${cssFile}`, '/assets/app.css');
fs.writeFileSync(indexPath, html);

console.log("✅ Deployment fix successful!");
console.log(`- JS file fixed: ${jsFile} → app.js`);
console.log(`- CSS file fixed: ${cssFile} → app.css`);
console.log("\nYou can now deploy your application normally using Replit.")