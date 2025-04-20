/**
 * Build script for deployment of Buzzd App
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
===========================================
  BUZZD DEPLOYMENT BUILD SCRIPT
===========================================
Time: ${new Date().toISOString()}
Current directory: ${process.cwd()}
===========================================
`);

// Step 1: Build the application
console.log('Step 1: Building the application...');
try {
  await new Promise((resolve, reject) => {
    exec('npm run build', { stdio: 'inherit' }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Build error: ${error.message}`);
        reject(error);
        return;
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
      resolve();
    });
  });
  console.log('✅ Application built successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Step 2: Ensure client directory exists
console.log('\nStep 2: Setting up client directory...');
if (!fs.existsSync('client')) {
  fs.mkdirSync('client', { recursive: true });
  console.log('Created client directory');
}

// Step 3: Copy built files to client/dist if they're not already there
console.log('\nStep 3: Checking built files...');
if (fs.existsSync('dist') && !fs.existsSync('client/dist')) {
  fs.mkdirSync('client/dist', { recursive: true });
  
  // Copy dist to client/dist
  fs.readdirSync('dist').forEach(file => {
    const sourcePath = path.join('dist', file);
    const targetPath = path.join('client/dist', file);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      fs.readdirSync(sourcePath).forEach(subFile => {
        fs.copyFileSync(
          path.join(sourcePath, subFile),
          path.join(targetPath, subFile)
        );
      });
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
  
  console.log('✅ Copied built files to client/dist');
} else if (fs.existsSync('client/dist')) {
  console.log('✅ client/dist already exists, skipping copy');
} else {
  console.log('⚠️ No dist directory found after build!');
}

// Step 4: Ensure we have a deployment server file
console.log('\nStep 4: Checking deployment server files...');
if (!fs.existsSync('server.js')) {
  console.log('⚠️ server.js not found! Please create it manually.');
}

// Finish
console.log(`
===========================================
  DEPLOYMENT BUILD COMPLETE
===========================================
Next steps:
1. Deploy your app using: node server.js
2. Or deploy on Replit with Run command: node server.js
===========================================
`);