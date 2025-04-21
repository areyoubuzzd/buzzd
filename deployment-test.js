/**
 * Deployment Test Script
 * 
 * This script can be included in your production-ready.js file for troubleshooting
 * deployment issues. It will create a special diagnostic endpoint that returns
 * detailed information about your deployment environment.
 */

import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

// Create router
const router = express.Router();

// Convert exec to Promise-based
const execPromise = util.promisify(exec);

// Get system info
async function getSystemInfo() {
  try {
    const { stdout: nodeVersion } = await execPromise('node --version');
    const { stdout: npmVersion } = await execPromise('npm --version');
    const { stdout: ls } = await execPromise('ls -la');
    const { stdout: ps } = await execPromise('ps aux');
    
    return {
      nodeVersion: nodeVersion.trim(),
      npmVersion: npmVersion.trim(),
      files: ls.trim(),
      processes: ps.trim()
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Check API status
async function checkApi(apiPort) {
  try {
    const collections = await fetch(`http://localhost:${apiPort}/api/collections`);
    const collectionsData = await collections.json();
    
    const deals = await fetch(`http://localhost:${apiPort}/api/deals/collections/all?lat=1.3521&lng=103.8198`);
    const dealsData = await deals.json();
    
    return {
      collectionsStatus: collections.status,
      collectionsLength: collectionsData ? collectionsData.length : 0,
      dealsStatus: deals.status,
      dealsLength: dealsData ? dealsData.length : 0
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Find client files
function findClientFiles() {
  const possiblePaths = [
    'dist/public',
    'dist',
    'client/dist',
    'client',
    'public'
  ];
  
  const results = {};
  for (const dir of possiblePaths) {
    if (fs.existsSync(dir)) {
      try {
        const stats = fs.statSync(dir);
        if (stats.isDirectory()) {
          const files = fs.readdirSync(dir);
          results[dir] = {
            exists: true,
            files
          };
          
          // Check for specific files
          if (files.includes('index.html')) {
            const indexHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
            results[dir].indexHtml = {
              size: indexHtml.length,
              firstLines: indexHtml.split('\n').slice(0, 10).join('\n')
            };
          }
          
          // Check for assets directory
          if (files.includes('assets')) {
            const assetFiles = fs.readdirSync(path.join(dir, 'assets'));
            results[dir].assets = assetFiles;
          }
        }
      } catch (error) {
        results[dir] = { error: error.message };
      }
    } else {
      results[dir] = { exists: false };
    }
  }
  
  return results;
}

// GET /deployment-test
router.get('/', async (req, res) => {
  const apiPort = req.app.get('api-port') || 5000;
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    systemInfo: await getSystemInfo(),
    apiStatus: await checkApi(apiPort),
    clientFiles: findClientFiles(),
    env: {
      PORT: process.env.PORT,
      API_PORT: process.env.API_PORT,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set'
    }
  };
  
  res.json(results);
});

export default router;