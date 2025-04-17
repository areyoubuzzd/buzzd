#!/bin/bash

# Script to clean the database and import fresh data
# Usage: ./scripts/refresh-database.sh <establishments_url_or_path> <deals_url_or_path>

# Check if both arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: ./scripts/refresh-database.sh <establishments_url_or_path> <deals_url_or_path>"
    exit 1
fi

ESTABLISHMENTS_SOURCE=$1
DEALS_SOURCE=$2

echo "Starting database refresh process..."

# Step 1: Clear all database tables
echo "Clearing existing data from database..."
npx tsx scripts/clear-database-tables.ts

# Check if clearing was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to clear database. Aborting."
    exit 1
fi

echo "Database cleared successfully."

# Step 2: Import fresh data
echo "Importing fresh data from provided sources:"
echo "Establishments: $ESTABLISHMENTS_SOURCE"
echo "Deals: $DEALS_SOURCE"

npx tsx scripts/import-fresh-data.ts "$ESTABLISHMENTS_SOURCE" "$DEALS_SOURCE"

# Check if import was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to import data. Aborting."
    exit 1
fi

echo "Database refresh completed successfully! ✅"