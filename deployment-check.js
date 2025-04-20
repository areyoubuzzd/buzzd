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

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Color codes for output formatting
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function logColor(message, color) {
  console.log(color + message + colors.reset);
}

// Check if --verify-build argument was passed
const shouldVerifyBuild = process.argv.includes('--verify-build');

// Header
logColor('🔍 DEPLOYMENT READINESS CHECK 🔍', colors.magenta);
logColor('This tool helps verify your app is ready for deployment', colors.cyan);
logColor('--------------------------------------------------', colors.magenta);

// Initialize check results
let allChecksPass = true;
const warnings = [];

// Check 1: Verify .env file and environment variables
logColor('\n1️⃣ Checking environment configuration...', colors.cyan);

const requiredEnvVars = [
  'DATABASE_URL',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingEnvVars.push(envVar);
  }
}

if (missingEnvVars.length > 0) {
  logColor(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`, colors.red);
  allChecksPass = false;
} else {
  logColor('✅ All required environment variables are set', colors.green);
}

// Check 2: Verify database connection
logColor('\n2️⃣ Checking database configuration...', colors.cyan);

if (!process.env.DATABASE_URL) {
  logColor('❌ Missing DATABASE_URL environment variable', colors.red);
  allChecksPass = false;
} else {
  try {
    // We won't actually test the connection here as that requires the application code
    // In a more comprehensive check, you would import db.js and test a simple query
    logColor('✅ DATABASE_URL environment variable is set', colors.green);
  } catch (error) {
    logColor(`❌ Error connecting to database: ${error.message}`, colors.red);
    allChecksPass = false;
  }
}

// Check 3: Verify required files existence
logColor('\n3️⃣ Checking required files...', colors.cyan);

const requiredFiles = [
  'simple-fix.js',
  'client/index.html',
  'server/index.ts',
  'package.json'
];

const missingFiles = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  logColor(`❌ Missing required files: ${missingFiles.join(', ')}`, colors.red);
  allChecksPass = false;
} else {
  logColor('✅ All required files are present', colors.green);
}

// Check 4: Verify package.json includes required scripts
logColor('\n4️⃣ Checking package.json configuration...', colors.cyan);

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredScripts = ['build', 'dev'];
  const missingScripts = [];
  
  for (const script of requiredScripts) {
    if (!packageJson.scripts || !packageJson.scripts[script]) {
      missingScripts.push(script);
    }
  }
  
  if (missingScripts.length > 0) {
    logColor(`❌ Missing required scripts in package.json: ${missingScripts.join(', ')}`, colors.red);
    allChecksPass = false;
  } else {
    logColor('✅ All required scripts are configured in package.json', colors.green);
  }
  
  // Verify dependency versions
  if (!packageJson.dependencies || !packageJson.devDependencies) {
    warnings.push('Could not verify dependency versions');
  }
  
} catch (error) {
  logColor(`❌ Error reading package.json: ${error.message}`, colors.red);
  allChecksPass = false;
}

// Check 5 (Optional): Verify build
if (shouldVerifyBuild) {
  logColor('\n5️⃣ Verifying build process (this may take a minute)...', colors.cyan);
  
  try {
    // Clean dist directory
    if (fs.existsSync('dist')) {
      execSync('rm -rf dist');
      logColor('Removed old dist directory', colors.yellow);
    }
    
    // Run simple-fix.js instead of a regular build
    logColor('Running deployment fix script...', colors.yellow);
    execSync('node simple-fix.js', { stdio: 'inherit' });
    
    // Verify dist directory was created
    if (!fs.existsSync('dist/public')) {
      logColor('❌ Build failed - dist/public directory not created', colors.red);
      allChecksPass = false;
    } else {
      logColor('✅ Build completed successfully', colors.green);
      
      // Verify stable file names
      const indexHtmlPath = path.join('dist', 'public', 'index.html');
      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      
      const hasStableJs = indexHtml.includes('index-stable.js');
      const hasStableCss = indexHtml.includes('index-stable.css');
      
      if (!hasStableJs || !hasStableCss) {
        logColor('❌ Build did not produce stable filenames for assets', colors.red);
        logColor('Run `node simple-fix.js` before deploying', colors.yellow);
        allChecksPass = false;
      } else {
        logColor('✅ Build produced stable filenames for assets', colors.green);
      }
    }
  } catch (error) {
    logColor(`❌ Build verification failed: ${error.message}`, colors.red);
    allChecksPass = false;
  }
}

// Final summary
logColor('\n--------------------------------------------------', colors.magenta);
if (allChecksPass) {
  logColor('✅ ALL CHECKS PASSED - Your app is ready for deployment!', colors.green);
  
  if (warnings.length > 0) {
    logColor('\nWarnings (these will not prevent deployment):', colors.yellow);
    warnings.forEach(warning => logColor(`⚠️ ${warning}`, colors.yellow));
  }
  
  logColor('\nNext steps:', colors.cyan);
  logColor('1. Run `node simple-fix.js` to prepare for deployment', colors.yellow);
  logColor('2. Deploy using the Replit interface', colors.yellow);
  logColor('3. Verify your deployment at your replit.app domain', colors.yellow);
} else {
  logColor('❌ SOME CHECKS FAILED - Fix the issues above before deploying', colors.red);
  
  if (warnings.length > 0) {
    logColor('\nWarnings:', colors.yellow);
    warnings.forEach(warning => logColor(`⚠️ ${warning}`, colors.yellow));
  }
  
  logColor('\nRecommended actions:', colors.cyan);
  logColor('1. Fix the issues identified above', colors.yellow);
  logColor('2. Run this check again: node deployment-check.js', colors.yellow);
  logColor('3. Once all checks pass, deploy the application', colors.yellow);
}