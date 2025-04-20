#!/usr/bin/env node
/**
 * Deployment Preparation Script
 * 
 * This script prepares the application for deployment by:
 * 1. Cleaning the dist directory
 * 2. Building the application with production settings
 * 3. Verifying that the built files exist and match references in the HTML
 * 
 * Run before deployment with: node scripts/prepare-deploy.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(distDir, 'public');
const assetsDir = path.join(publicDir, 'assets');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Logs a message with optional coloring
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Cleans the dist directory
 */
function cleanDist() {
  log('Cleaning dist directory...', colors.cyan);
  
  if (fs.existsSync(distDir)) {
    try {
      // Use the more robust rimraf approach (implemented in JS)
      const rimraf = (dir) => {
        if (fs.existsSync(dir)) {
          fs.readdirSync(dir).forEach((file) => {
            const curPath = path.join(dir, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              // Recursive call
              rimraf(curPath);
            } else {
              // Delete file
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(dir);
        }
      };
      
      rimraf(distDir);
      fs.mkdirSync(distDir, { recursive: true });
      log('✅ Dist directory cleaned successfully', colors.green);
    } catch (error) {
      log(`❌ Error cleaning dist directory: ${error.message}`, colors.red);
      process.exit(1);
    }
  } else {
    fs.mkdirSync(distDir, { recursive: true });
    log('✅ Created new dist directory', colors.green);
  }
}

/**
 * Builds the application
 */
function buildApp() {
  log('Building application with production settings...', colors.cyan);
  
  try {
    execSync('NODE_ENV=production npm run build', { 
      stdio: 'inherit',
      cwd: rootDir
    });
    log('✅ Build completed successfully', colors.green);
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

/**
 * Verifies the build output
 */
function verifyBuild() {
  log('Verifying build output...', colors.cyan);
  
  // Check if the public directory exists
  if (!fs.existsSync(publicDir)) {
    log(`❌ Public directory not found: ${publicDir}`, colors.red);
    process.exit(1);
  }
  
  // Check if the index.html file exists
  const indexHtmlPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    log(`❌ index.html not found: ${indexHtmlPath}`, colors.red);
    process.exit(1);
  }
  
  // Read the index.html file
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Extract JS and CSS file references
  const jsMatch = indexHtml.match(/src="\/assets\/(index-[^"]+\.js)"/);
  const cssMatch = indexHtml.match(/href="\/assets\/(index-[^"]+\.css)"/);
  
  if (!jsMatch) {
    log('❌ JS file reference not found in index.html', colors.red);
    process.exit(1);
  }
  
  if (!cssMatch) {
    log('❌ CSS file reference not found in index.html', colors.red);
    process.exit(1);
  }
  
  const jsFile = jsMatch[1];
  const cssFile = cssMatch[1];
  
  const jsPath = path.join(assetsDir, jsFile);
  const cssPath = path.join(assetsDir, cssFile);
  
  // Check if the referenced files exist
  if (!fs.existsSync(jsPath)) {
    log(`❌ Referenced JS file not found: ${jsPath}`, colors.red);
    process.exit(1);
  }
  
  if (!fs.existsSync(cssPath)) {
    log(`❌ Referenced CSS file not found: ${cssPath}`, colors.red);
    process.exit(1);
  }
  
  log(`✅ Verified JS file: ${jsFile}`, colors.green);
  log(`✅ Verified CSS file: ${cssFile}`, colors.green);
  
  // Count assets
  const assetFiles = fs.readdirSync(assetsDir);
  log(`✅ Found ${assetFiles.length} asset files`, colors.green);
  
  log('✅ Build verification completed successfully', colors.green);
}

/**
 * Main function
 */
function main() {
  log('🚀 Starting deployment preparation...', colors.bright + colors.blue);
  
  cleanDist();
  buildApp();
  verifyBuild();
  
  log('✅ Deployment preparation completed successfully', colors.bright + colors.green);
  log('The application is ready for deployment', colors.cyan);
}

main();