# Buzzd Deployment Guide

This guide provides step-by-step instructions for successfully deploying the Buzzd application on Replit.

## Deployment Steps

### 1. Run the Deployment Shell Script (Recommended)

The simplest way to prepare for deployment is to run the deployment shell script:

```bash
./deploy.sh
```

This comprehensive script:
1. Cleans previous builds
2. Runs a fresh production build 
3. Creates stable asset files (index-stable.js, index-stable.css)
4. Updates index.html to reference these stable files
5. Verifies all changes are correctly applied

### Alternative: Run the Pre-Deployment JavaScript Script

If you prefer a JavaScript-based solution, you can use:

```bash
node pre-deploy.js
```

This script performs similar operations as deploy.sh but is implemented in JavaScript.

### 2. Deploy the Application

1. After running the fix script, click the **Deploy** button in the Replit interface
2. Use the default build and run commands provided by Replit
3. Click **Deploy** to start the deployment process

### 3. Verify Deployment

After deployment completes:
1. Check that the application loads correctly at your .replit.app domain
2. Verify that all pages load without JavaScript errors
3. Test core functionality (authentication, deal browsing, etc.)

## Troubleshooting

### File Hash Mismatch Issues

If you encounter deployment errors related to file references:

1. Run the shell deployment script: `./deploy.sh`
2. If that doesn't work, try the JavaScript alternative: `node pre-deploy.js`
3. As a last resort, run the individual steps manually:
   - Clean build: `rm -rf dist`
   - Build: `NODE_ENV=production npm run build`
   - Fix assets: `node bust-cache.js`
4. Verify that the dist/public/index.html references stable file versions (index-stable.js, index-stable.css)
5. Try the deployment process again

### Database Connection Issues

If the application deploys but data doesn't load:

1. Verify that the DATABASE_URL environment secret is correctly set
2. Check server logs for database connection errors
3. Ensure all database migrations have been applied

## Deployment Script Details

### deploy.sh (Recommended)

The `deploy.sh` shell script is an all-in-one solution that:
- Cleans previous builds
- Runs a fresh production build 
- Creates stable asset files
- Updates index.html references
- Verifies all changes were applied correctly

### pre-deploy.js

The `pre-deploy.js` JavaScript script is an alternative that:
- Cleans previous builds
- Runs a fresh production build 
- Applies cache-busting fixes
- Verifies deployment readiness

### bust-cache.js

The `bust-cache.js` script specifically addresses the hash mismatch issue:
- Creates copies of JS and CSS files with stable names (index-stable.js, index-stable.css)
- Updates index.html to reference these stable filenames
- Verifies the changes were applied correctly

### simple-fix.js (Legacy)

The original `simple-fix.js` script is a simpler version that:
- Builds the application
- Creates stable file versions
- Updates references in index.html

## Why This Approach Works

This approach ensures consistent file references between builds and deployments, avoiding the common issue of hashed filenames changing between different environments. 

Vite generates different hash values for asset filenames (like index-A0Qm7ilb.js) on each build. Replit's deployment environment may use a different build process that produces different hash values, causing reference mismatches. Our solution creates stable, unhashed filenames that remain consistent regardless of the build environment.