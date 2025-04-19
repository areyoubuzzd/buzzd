/**
 * Deployment Readiness Check Script
 * 
 * This script verifies that the application is properly configured for deployment.
 * Run it before deploying to ensure everything is set up correctly.
 */

import http from 'http';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

console.log('🔍 Starting deployment readiness check...');

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

// Run the server check
await pingServer();

console.log('\n🚀 Deployment readiness check completed');
console.log('If all checks passed, you are ready to deploy!');
console.log('If any checks failed, please address the issues before deploying.');