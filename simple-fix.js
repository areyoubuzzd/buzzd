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

console.log('🔧 SIMPLE DEPLOYMENT FIX 🔧');
console.log('Fixing the deployment to avoid file hash issues...');

// Step 1: Clean the build
console.log('\n1️⃣ Cleaning previous builds...');
if (fs.existsSync('dist')) {
  execSync('rm -rf dist');
  console.log('✅ Removed old dist directory');
}

// Step 2: Build the app
console.log('\n2️⃣ Building the app...');
try {
  execSync('NODE_ENV=production npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Fix the file references
console.log('\n3️⃣ Fixing file references...');

const publicDir = path.join('dist', 'public');
const assetsDir = path.join(publicDir, 'assets');
const indexHtmlPath = path.join(publicDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ index.html not found. Build may have failed.');
  process.exit(1);
}

// Read the index.html file
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Extract JS file reference
const jsMatch = indexHtml.match(/src="\/assets\/([^"]+\.js)"/);
if (!jsMatch) {
  console.error('❌ Could not find JS file reference in index.html');
  process.exit(1);
}

const jsFile = jsMatch[1];
console.log(`Found JS file: ${jsFile}`);

// Extract CSS file reference
const cssMatch = indexHtml.match(/href="\/assets\/([^"]+\.css)"/);
if (!cssMatch) {
  console.error('❌ Could not find CSS file reference in index.html');
  process.exit(1);
}

const cssFile = cssMatch[1];
console.log(`Found CSS file: ${cssFile}`);

// Create fixed copies of the files
try {
  // JS file
  const jsPath = path.join(assetsDir, jsFile);
  const fixedJsPath = path.join(assetsDir, 'index-stable.js');
  fs.copyFileSync(jsPath, fixedJsPath);
  console.log(`✅ Created fixed JS file: assets/index-stable.js`);
  
  // CSS file
  const cssPath = path.join(assetsDir, cssFile);
  const fixedCssPath = path.join(assetsDir, 'index-stable.css');
  fs.copyFileSync(cssPath, fixedCssPath);
  console.log(`✅ Created fixed CSS file: assets/index-stable.css`);
  
  // Update index.html
  indexHtml = indexHtml.replace(
    `src="/assets/${jsFile}"`,
    `src="/assets/index-stable.js"`
  );
  
  indexHtml = indexHtml.replace(
    `href="/assets/${cssFile}"`,
    `href="/assets/index-stable.css"`
  );
  
  fs.writeFileSync(indexHtmlPath, indexHtml);
  console.log('✅ Updated index.html to use stable file names');
  
  console.log('\n✨ DEPLOYMENT FIX COMPLETED ✨');
  console.log('Your app is now ready for deployment.');
  console.log('Use the Replit deployment interface to deploy it.');
} catch (error) {
  console.error('❌ Error fixing file references:', error.message);
  process.exit(1);
}