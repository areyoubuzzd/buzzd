/**
 * Deployment Readiness Check Script
 * 
 * This script verifies that the application is properly configured for deployment.
 * Run it before deploying to ensure everything is set up correctly.
 * 
 * Usage:
 * - Simple check: node deployment-check.js
 * - Full check with build verification: node deployment-check.js --verify-build
 */

import http from 'http';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

dotenv.config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function logColor(message, color) {
  console.log(`${color}${message}${colors.reset}`);
}

// Command line arguments
const args = process.argv.slice(2);
const shouldVerifyBuild = args.includes('--verify-build');

logColor('🔍 Starting deployment readiness check...', colors.bright + colors.blue);

// Check if essential environment variables are set
console.log('\n📋 Checking environment variables...');
const requiredEnvVars = [
  'DATABASE_URL',
  'CLOUDFLARE_ACCOUNT_ID', 
  'CLOUDFLARE_IMAGES_API_TOKEN'
];

const missingVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:', missingVars.join(', '));
  console.log('   Make sure to set these variables in your deployment environment.');
} else {
  console.log('✅ All required environment variables are set.');
}

// Check if the server is running
console.log('\n🌐 Checking if server is running...');
const pingServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/collections', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Server is running and API is accessible');
        resolve(true);
      } else {
        console.log(`❌ Server returned status code ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      console.log('❌ Server is not running or not accessible', err.message);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      console.log('❌ Server request timed out');
      resolve(false);
    });
  });
};

// Check package.json for proper build and start scripts
console.log('\n📦 Checking build and start scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts.build && packageJson.scripts.start) {
    console.log('✅ Build and start scripts found in package.json');
  } else {
    console.log('❌ Missing build and/or start scripts in package.json');
  }
} catch (err) {
  console.log('❌ Error reading package.json:', err.message);
}

// Check .replit configuration
console.log('\n⚙️ Checking .replit configuration...');
try {
  const replitConfig = fs.readFileSync('./.replit', 'utf8');
  
  if (replitConfig.includes('[deployment]')) {
    console.log('✅ Deployment configuration found in .replit file');
  } else {
    console.log('❌ No deployment configuration found in .replit file');
  }
  
  if (replitConfig.includes('externalPort = 80') && replitConfig.includes('localPort = 5000')) {
    console.log('✅ Port configuration for deployment found in .replit file');
  } else {
    console.log('❌ Missing or incorrect port configuration in .replit file');
  }
} catch (err) {
  console.log('❌ Error reading .replit file:', err.message);
}

// Check for dist directory structure
const checkDistStructure = async () => {
  logColor('\n📂 Checking dist directory structure...', colors.yellow);
  
  const distDir = './dist';
  const publicDir = path.join(distDir, 'public');
  const assetsDir = path.join(publicDir, 'assets');
  
  if (!fs.existsSync(distDir)) {
    logColor('❌ dist directory not found', colors.red);
    return false;
  }
  
  if (!fs.existsSync(publicDir)) {
    logColor('❌ dist/public directory not found', colors.red);
    return false;
  }
  
  if (!fs.existsSync(assetsDir)) {
    logColor('❌ dist/public/assets directory not found', colors.red);
    return false;
  }
  
  const indexHtmlPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    logColor('❌ index.html not found in dist/public', colors.red);
    return false;
  }
  
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Extract JS and CSS file references
  const jsMatch = indexHtml.match(/src="\/assets\/(index-[^"]+\.js)"/);
  const cssMatch = indexHtml.match(/href="\/assets\/(index-[^"]+\.css)"/);
  
  if (!jsMatch) {
    logColor('❌ JS file reference not found in index.html', colors.red);
    return false;
  }
  
  if (!cssMatch) {
    logColor('❌ CSS file reference not found in index.html', colors.red);
    return false;
  }
  
  const jsFile = jsMatch[1];
  const cssFile = cssMatch[1];
  
  const jsPath = path.join(assetsDir, jsFile);
  const cssPath = path.join(assetsDir, cssFile);
  
  if (!fs.existsSync(jsPath)) {
    logColor(`❌ Referenced JS file not found: ${jsFile}`, colors.red);
    return false;
  }
  
  if (!fs.existsSync(cssPath)) {
    logColor(`❌ Referenced CSS file not found: ${cssFile}`, colors.red);
    return false;
  }
  
  const assetFiles = fs.readdirSync(assetsDir);
  logColor(`✅ Found ${assetFiles.length} asset files in dist/public/assets`, colors.green);
  logColor(`✅ Build output structure looks good`, colors.green);
  
  return true;
};

// Verify build process
const verifyBuild = async () => {
  if (!shouldVerifyBuild) {
    logColor('\nSkipping build verification. Use --verify-build to check the build.', colors.yellow);
    return;
  }
  
  logColor('\n🔨 Verifying build process...', colors.yellow);
  
  try {
    logColor('Running clean build...', colors.cyan);
    // Backup the dist directory if it exists
    const distExists = fs.existsSync('./dist');
    if (distExists) {
      fs.renameSync('./dist', './dist_backup');
    }
    
    // Run the build
    execSync('NODE_ENV=production npm run build', { stdio: 'inherit' });
    
    // Check the output
    const buildSuccess = await checkDistStructure();
    
    if (buildSuccess) {
      logColor('✅ Build process completed successfully', colors.green);
    } else {
      logColor('❌ Build process failed verification', colors.red);
    }
    
    // Restore the original dist directory
    if (distExists) {
      // Remove the newly created dist
      execSync('rm -rf ./dist');
      // Restore the backup
      fs.renameSync('./dist_backup', './dist');
      logColor('Original dist directory restored', colors.cyan);
    }
  } catch (error) {
    logColor(`❌ Build verification failed: ${error.message}`, colors.red);
    
    // Restore the original dist directory on error
    if (fs.existsSync('./dist_backup')) {
      // Remove the failed build if it exists
      if (fs.existsSync('./dist')) {
        execSync('rm -rf ./dist');
      }
      // Restore the backup
      fs.renameSync('./dist_backup', './dist');
      logColor('Original dist directory restored after error', colors.cyan);
    }
  }
};

// Run the checks
await pingServer();

// Check the current build output
if (fs.existsSync('./dist')) {
  await checkDistStructure();
} else {
  logColor('\n❌ No dist directory found. Run "npm run build" first.', colors.red);
}

// Verify build process if requested
await verifyBuild();

logColor('\n🚀 Deployment readiness check completed', colors.bright + colors.green);
logColor('If all checks passed, you are ready to deploy!', colors.cyan);
logColor('If any checks failed, please address the issues before deploying.', colors.yellow);

// Suggest next steps
logColor('\n📋 Recommended deployment steps:', colors.bright + colors.blue);
logColor('1. Run "node scripts/prepare-deploy.js" to prepare for deployment', colors.cyan);
logColor('2. Use the Replit deployment interface to deploy your application', colors.cyan);
logColor('3. After deployment, verify that your application is working correctly', colors.cyan);