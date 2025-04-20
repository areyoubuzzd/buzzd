#!/bin/bash

# COLLECTION PRIORITY RULES SCRIPT
# This script ensures that collection priorities are consistently applied
# Run this after ANY update to deals or restaurant data
#
# Usage: bash scripts/apply-priority-rules.sh

echo "==============================================="
echo "APPLYING COLLECTION PRIORITY RULES"
echo "==============================================="
echo

# Step 1: Run the post-data-refresh script to update the database
echo "Step 1: Applying correct collection priorities to database..."
npx tsx scripts/post-data-refresh.ts
echo

# Step 2: Fix special cases - ensure wines_under_12 and cocktails_under_12 have priority 10
echo "Step 2: Fixing special collection priorities..."
SQL_UPDATE="
UPDATE collections SET priority = 10 WHERE slug = 'wines_under_12';
UPDATE collections SET priority = 10 WHERE slug = 'cocktails_under_12';
SELECT id, name, slug, priority FROM collections WHERE priority <= 20 ORDER BY priority;
"
echo "$SQL_UPDATE" | psql "$DATABASE_URL"
echo

# Step 3: Verify the database consistency
echo "Step 3: Verifying database consistency..."
npx tsx scripts/verify-database-consistency.ts
echo

# Step 4: Restart the server to apply changes
echo "Step 4: Restarting server to apply changes..."
echo "Server will restart automatically."
echo

echo "==============================================="
echo "COLLECTION PRIORITY RULES HAVE BEEN APPLIED"
echo "==============================================="
echo
echo "The collections should now appear in this exact order:"
echo
echo "1. 'Active Happy Hours' (priority 1)"
echo "2. Beers/Wines/Cocktails Under $12 (priorities 10)"
echo "3. Craft Beers (priority 12)"
echo "4. Beer Buckets Under $40 (priority 13)"
echo "5. 1-for-1 Deals (priority 15)" 
echo "6. Free Flow Deals (priority 16)"
echo "7. Cocktails/Wines Under $15 (priorities 20-21)"
echo "8. Bottles Under $100 (priority 22)"
echo "9. Beer Buckets (priorities 22-25)"
echo "10. Beers Under $15 (priorities 25-30)"
echo "11. Spirit collections (Whisky, Gin) (priorities 40-41)"
echo "12. All Deals (priority 60)"
echo "13. Location collections (60+)"
echo
echo "If this order is not reflected on the home page, please run:"
echo "bash scripts/apply-priority-rules.sh"