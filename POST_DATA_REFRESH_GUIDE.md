# Post-Data Refresh Utility Guide

## Overview

This utility helps maintain the integrity and quality of deal collections after any data refresh or update operation. It performs three critical tasks:

1. **Updates collection priorities** - Ensures collections appear in the correct order (Happy Hours Nearby first, followed by All Deals, etc.)
2. **Ensures sufficient deals in "Happy Hours Nearby"** - Makes sure this important collection has at least 25 deals
3. **Optimizes deal sorting** - Adds metadata to deals so they sort consistently (active deals first, then by distance)

## When To Use

Run this utility after:
- Importing new deals from Google Sheets
- Running any data refresh script
- Making bulk updates to deals or establishments
- Whenever you notice issues with collection sorting or the "Happy Hours Nearby" collection

## How To Use

Simply run the provided shell script:

```bash
./refresh-collections.sh
```

This will execute the utility and restart the application to apply changes.

## What It Does

### 1. Collection Prioritization

The utility sets explicit priority values for all collections based on a predefined hierarchy:

- **Priority 1-9**: Core collections (Active Happy Hours, All Deals)
- **Priority 10-19**: Beer collections
- **Priority 20-29**: Wine collections
- **Priority 30-39**: Cocktail collections
- **Priority 40-49**: Spirit collections
- **Priority 50-59**: Special collections (1-for-1, Free Flow, etc.)
- **Priority 60-69**: Location-based collections

### 2. Happy Hours Nearby Population

The utility ensures the "active_happy_hours" collection (displayed as "Happy Hours Nearby") has at least 25 deals. If it has fewer, the utility will:

1. Find deals that aren't yet in the collection
2. Check which ones are currently active
3. Add the best candidates to the collection
4. Prioritize active deals, then sort by price

### 3. Deal Sorting Optimization

The utility adds a `sort_order` field to all deals, which ensures consistent sorting:

- Active deals get values 1-99 (based on price)
- Inactive deals get values 100-199 (based on price)

This guarantees that active deals always appear first in collections, while maintaining secondary sorting by price.

## Troubleshooting

If you encounter issues:

1. Check the console output for errors
2. Verify the database connection is working
3. Ensure all needed collections exist in the database
4. Try running each function individually for more detailed debugging

## Manual Execution

If needed, you can run individual functions of the utility:

```bash
# Run just the collection priorities update
npx tsx scripts/post-data-refresh.ts updateCollectionPriorities

# Run just the Happy Hours Nearby population
npx tsx scripts/post-data-refresh.ts ensureMinimumDealsInActiveHappyHours

# Run just the deal sorting optimization
npx tsx scripts/post-data-refresh.ts updateDealSortingInfo
```

Note: These individual functions are not currently implemented, but could be added if needed.