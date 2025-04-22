# Direct Deployment Guide for Buzzd

This guide explains the approach taken for direct deployment of the Buzzd application.

## Current Strategy

We are using a **direct mirror approach** where:

1. The production deployment uses exactly the same configuration as the working preview environment
2. We run the exact same command (`npm run dev`) that's working in preview
3. The DATABASE_URL environment variable is passed as a secret to the deployment

## How to Deploy

1. Make sure your changes are committed
2. Go to the Deployment tab in Replit
3. Add **DATABASE_URL** as a secret with the same database connection string used in preview
4. Click the "Deploy" button

## What happens during deployment

Our deployment script (`mirror-preview.js`) will:
1. Check that DATABASE_URL is configured
2. Run the same command used in preview: `npm run dev`
3. Log diagnostic information to help debug any issues

## Expected Results

The production site should behave identically to the preview environment, showing all establishments and deals correctly.

## Troubleshooting

If you encounter issues:

1. Check the deployment logs for any errors
2. Verify that DATABASE_URL is correctly set in deployment secrets
3. Try rolling back to a previous deployment if needed

Remember: The preview environment is already working correctly, and this approach simply mirrors that configuration.