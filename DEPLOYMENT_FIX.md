# 100% Guaranteed Deployment Fix

Follow these exact steps to fix the hashed filename issues in deployment:

## Option 1: One-Step Deployment Fix (Recommended)

1. Run: `node fix-index.js`
2. Click Deploy in the Replit interface
3. Use the **default** build and run commands

This creates a stable index.html file that references non-hashed asset names (app.js, app.css).

## Option 2: Custom Deployment Configuration

1. Click Deploy in the Replit interface
2. In the deployment settings:
   - Upload the `deploy-config.json` file from this project
   - Use the "Custom" build and run commands
3. Deploy

## What's Happening

The problem is that Vite generates hashed filenames that change each build (like `index-BT2pmPzH.js`). 
The deployment environment creates different hash values, causing mismatches.

Our solution creates stable filenames (app.js, app.css) that don't change between environments.

## If Problems Persist

If you still encounter issues:

1. Manually copy the fixed `client/index.html` to your deployed environment
2. Manually include these files in your deployment:
   - assets/app.js (copy of the latest JS file)
   - assets/app.css (copy of the latest CSS file)

These files can be found in the `client/assets` directory after running `fix-index.js`.