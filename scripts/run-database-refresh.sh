#!/bin/bash

# Database Refresh Procedure Script
# This script runs all the necessary steps after updating deals or restaurant data
# Run with: bash scripts/run-database-refresh.sh

echo "=========================================="
echo "HAPPY HOUR DEALS DATABASE REFRESH PROCEDURE"
echo "=========================================="
echo

# Step 1: Run the post-data refresh script to ensure proper priorities and collections
echo "Step 1: Running post-data refresh operations..."
npx tsx scripts/post-data-refresh.ts
echo

# Step 2: Verify database consistency
echo "Step 2: Verifying database consistency..."
npx tsx scripts/verify-database-consistency.ts
echo

# Show a reminder of the critical components
echo "=========================================="
echo "CRITICAL REMINDER"
echo "=========================================="
echo "1. Deal cards within collections should follow the 6-step priority:"
echo "   - Active deals come first (current day and time)"
echo "   - Then sort by explicit sort_order if available"
echo "   - Then sort by proximity to user location (if available)"
echo "   - Then sort by price (happy_hour_price field)"
echo "   - Then sort by savings percentage (higher first)"
echo "   - Finally sort alphabetically by establishment name"
echo
echo "2. Happy Hours Nearby collection must show 25 deals:"
echo "   - Should have 25 deals when available within 10km radius"
echo "   - Active deals prioritized over inactive ones"
echo
echo "3. Collections must have these exact priorities:"
echo "   - Active Happy Hours: priority 1"
echo "   - All Deals: priority 2 & 60"
echo "   - Budget beers/wines/cocktails (under $12): 10-13"
echo "   - 1-for-1 and freeflow deals: 15-19"
echo "   - Cocktails/Wines under $15: 20-22"
echo "   - Beer Buckets: 22-25"
echo "   - Beers under $15: 25-30"
echo "   - Spirit collections (Whisky, Gin): 40-41"
echo
echo "=========================================="
echo "DATABASE REFRESH COMPLETE"
echo "=========================================="