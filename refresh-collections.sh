#!/bin/bash
# Script to refresh collections after data updates
# This ensures proper deal sorting and collection organization

echo "Running post-data-refresh utility to optimize collections..."
npx tsx scripts/post-data-refresh.ts

echo "Collections refresh complete!"
echo "You should now see:"
echo "✓ Collections properly prioritized (Happy Hours Nearby first, then All Deals, etc.)"
echo "✓ At least 25 deals in the Happy Hours Nearby collection"
echo "✓ Active deals appearing first in all collections"
echo ""
echo "Restarting the application to apply changes..."