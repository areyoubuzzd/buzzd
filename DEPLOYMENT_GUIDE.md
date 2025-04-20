# Buzzd Deployment Guide

This document provides a step-by-step guide for deploying the Buzzd application to Replit.

## Deployment Prerequisites

Before deploying, ensure the following:

1. All required environment variables are set in the Replit Secrets tab:
   - `DATABASE_URL`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_IMAGES_API_TOKEN`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - Any other environment variables needed by the application

2. You have the latest code changes committed or synced to the Replit environment.

## Deployment Steps

### Step 1: Prepare the Deployment

Run the deployment preparation script to clean the build directory and create a fresh build:

```bash
node scripts/prepare-deploy.js
```

This script:
- Cleans the dist directory
- Builds the application with production settings
- Verifies that the built files match references in the HTML

### Step 2: Verify Deployment Readiness

Run the deployment check script to ensure everything is set up correctly:

```bash
node deployment-check.js
```

This will check:
- Environment variables
- Server accessibility
- Configuration files
- Build output

If any issues are reported, fix them before proceeding.

### Step 3: Deploy Using Replit's Deployment Feature

1. Click on the "Deploy" button in the Replit interface.
2. Review the settings to make sure:
   - The build command is set to `npm run build`
   - The run command is set to `npm run start`
   - The port is set to 5000 (or whatever is configured in `.replit`)

3. Click "Deploy" to start the deployment process.

### Step 4: Verify the Deployment

After the deployment completes:

1. Visit the deployed application URL (provided by Replit)
2. Test key features to ensure they're working correctly:
   - Login functionality
   - Nearby deals display
   - Deal details display
   - Navigation between sections
   - Location-based features

## Troubleshooting Deployment Issues

### Asset Loading Issues

If assets (JS, CSS, images) fail to load:

1. Run the prepare-deploy script again:
   ```bash
   node scripts/prepare-deploy.js
   ```

2. Manually delete the dist directory and rebuild:
   ```bash
   rm -rf dist
   NODE_ENV=production npm run build
   ```

3. Deploy again through the Replit interface.

### API Connection Issues

If the application loads but API calls fail:

1. Check environment variables in the deployed environment
2. Verify that the server is starting correctly by checking logs
3. Ensure the database is accessible from the deployed environment

### Session or Authentication Issues

If users can't log in or sessions aren't persisting:

1. Verify Firebase configuration is correct
2. Check that the required environment variables for authentication are set
3. Try clearing browser data and cookies

## Post-Deployment Checklist

After deploying, verify the following:

- [ ] Application loads correctly on different devices and browsers
- [ ] All images and assets load properly
- [ ] API endpoints return expected responses
- [ ] Authentication works as expected
- [ ] Location-based features work correctly
- [ ] Navigation between different sections functions properly

## Regular Maintenance

To ensure the deployed application continues to run smoothly:

1. Regularly backup the database
2. Monitor application performance and usage
3. Apply updates in a staging environment before deploying to production
4. Test after each deployment to ensure all features work as expected

For any further assistance or issues, refer to the Replit documentation or contact the development team.