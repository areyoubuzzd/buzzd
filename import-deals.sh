#!/bin/bash

# Exit on error
set -e

echo "=============================="
echo "Happy Hour Deals Import Script"
echo "=============================="
echo

# Run database migration first
echo "Step 1: Running database migration to update schema..."
npm run db:push
echo "Schema updated!"
echo

# Test Google Sheets connection
echo "Step 2: Testing Google Sheets connection..."
npx tsx server/scripts/test-deals-import.ts
echo

# Ask if user wants to import
read -p "Would you like to import deals from Google Sheets? (y/n): " choice
case "$choice" in 
  y|Y ) 
    echo "Importing deals from Google Sheets..."
    npx tsx server/scripts/test-deals-import.ts --import
    ;;
  * ) 
    echo "Import canceled."
    ;;
esac

echo
echo "Script completed!"