#!/bin/bash

# Script to refresh deals data from Google Sheets
# This script preserves existing application logic while updating deal data

echo "Starting deals refresh process..."

# Make sure environment variables are loaded
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create one with your credentials."
  exit 1
fi

# Run the TypeScript refresh script
npx tsx scripts/refresh-deals-data.ts

# Check if the script executed successfully
if [ $? -eq 0 ]; then
  echo "✅ Deals data has been successfully refreshed!"
  echo "You can now restart the application to see the updated deals."
else
  echo "❌ Error refreshing deals data. Check the logs above for details."
fi