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

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Starting special pre-deployment preparation...');

// Force clean the dist directory
console.log('Cleaning dist directory...');
try {
  if (fs.existsSync('./dist')) {
    execSync('rm -rf ./dist');
    console.log('✅ Existing dist directory removed');
  }
} catch (error) {
  console.error('❌ Error cleaning dist directory:', error.message);
  process.exit(1);
}

// Build with production settings
console.log('Building application for production...');
try {
  execSync('NODE_ENV=production npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Verify the output
console.log('Verifying build output...');
try {
  const indexHtmlPath = path.join('./dist/public', 'index.html');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Extract JS and CSS file references
  const jsMatch = indexHtml.match(/src="\/assets\/(index-[^"]+\.js)"/);
  const cssMatch = indexHtml.match(/href="\/assets\/(index-[^"]+\.css)"/);
  
  if (!jsMatch) {
    console.error('❌ JS file reference not found in index.html');
    process.exit(1);
  }
  
  if (!cssMatch) {
    console.error('❌ CSS file reference not found in index.html');
    process.exit(1);
  }
  
  const jsFile = jsMatch[1];
  const cssFile = cssMatch[1];
  
  console.log(`✅ JavaScript file reference: ${jsFile}`);
  console.log(`✅ CSS file reference: ${cssFile}`);
  
  // Verify the files exist
  const assetsDir = path.join('./dist/public', 'assets');
  const jsPath = path.join(assetsDir, jsFile);
  const cssPath = path.join(assetsDir, cssFile);
  
  if (!fs.existsSync(jsPath)) {
    console.error(`❌ Referenced JS file not found: ${jsPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(cssPath)) {
    console.error(`❌ Referenced CSS file not found: ${cssPath}`);
    process.exit(1);
  }
  
  console.log(`✅ All referenced files exist`);
  
  // Print some asset stats for verification
  const assetFiles = fs.readdirSync(assetsDir);
  console.log(`✅ Found ${assetFiles.length} asset files`);
  
  // Print success message
  console.log('\n✨ Pre-deployment preparation successful!');
  console.log('Now use the Replit deployment interface to deploy your application.');
  console.log('When asked for build command, use: npm run build');
  console.log('When asked for run command, use: npm run start');
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}