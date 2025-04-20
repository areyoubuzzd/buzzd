# Database Refresh Process

## IMPORTANT: Always follow this process when updating deals or restaurant data!

This guide outlines the required steps to maintain data consistency in the Happy Hour Deals application when refreshing data. Following these steps in order is **critical** to ensure proper collection prioritization and display.

## Step 1: Perform Your Data Update

First, perform whatever data update you need to do:

- Import new deals from Google Sheets
- Add new restaurants
- Update existing deals or restaurants
- Run any custom import scripts

## Step 2: Apply the Priority Rules

After updating the data, ALWAYS run the priority rules script:

```bash
bash scripts/apply-priority-rules.sh
```

This script will:
1. Apply the correct prioritization scheme to all collections
2. Ensure wines_under_12 and cocktails_under_12 have priority 10
3. Verify database consistency with our rules
4. Ensure "Happy Hours Nearby" has 25 deals (if available within 10km)

## Step 3: Verify the Results

After running the script, verify that:

1. Collections appear on the home page in this exact order:
   - Active Happy Hours (always first)
   - Beers/Wines/Cocktails under $12
   - Craft Beers
   - Beer Buckets Under $40
   - 1-for-1 Deals
   - Free Flow Deals
   - Cocktails/Wines under $15
   - Bottles under $100
   - Beer Buckets
   - Beers Under $15
   - Spirit collections (Whisky, Gin)
   - All Deals
   - Location-based collections

2. Each collection correctly shows active deals first, then sorts by:
   - Explicit sort_order if available
   - Distance from user (if location available)
   - Price (lower first)
   - Savings percentage (higher first)
   - Establishment name (alphabetically)

## Reference: Collection Priority Values

These are the exact priority values that should be used for collections:

| Collection | Priority Range |
|------------|---------------|
| "Active Happy Hours" | 1 |
| Beers/Wines/Cocktails Under $12 | 10 |
| Craft Beers | 12 |
| Beer Buckets Under $40 | 13 |
| 1-for-1 deals | 15 |
| Freeflow deals | 16 |
| Cocktails under $15 | 20 |
| Wines Under $15 | 21 |
| Bottles under $100 | 22 |
| Beer Buckets | 22-25 |
| Beers Under $15 | 25 |
| Spirit collections (Whisky, Gin) | 40-41 |
| "All Deals" | 60 |

## Troubleshooting

If collections are not appearing in the correct order after following these steps:

1. Run the verification script directly:
   ```
   npx tsx scripts/verify-database-consistency.ts
   ```

2. Check the server logs to confirm the correct priorities are being loaded:
   ```
   'Returning collections sorted by priority:' in the logs
   ```

3. If issues persist, manually check the database:
   ```sql
   SELECT id, name, slug, priority FROM collections ORDER BY priority;
   ```

4. Run the priority rules script again:
   ```bash
   bash scripts/apply-priority-rules.sh
   ```