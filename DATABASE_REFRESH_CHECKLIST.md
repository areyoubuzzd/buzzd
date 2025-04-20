# Database Refresh Checklist

## IMPORTANT: Run through this checklist EVERY TIME after updating deals or restaurant data!

## 1. Six-Step Deal Priority Within Collections

**Ensure the 6-step deal sorting process is correctly applied within each collection:**

1. **Step 1:** Always show ACTIVE deals first (based on current day and time)
2. **Step 2:** Sort by explicit `sort_order` field if available
3. **Step 3:** Sort by distance from user location (if location data available)
4. **Step 4:** Sort by price (happy_hour_price field)
5. **Step 5:** Sort by savings percentage (higher first)
6. **Step 6:** Sort alphabetically by establishment name as final tiebreaker

**Where to check this:**
- `server/routes/deals.ts` - The `sortDealsBySecondaryFactors` function
- `client/src/pages/home-page.tsx` - The `sortDeals` function

## 2. Happy Hours Nearby Collection Requirements

**Always ensure "Happy Hours Nearby" has exactly 25 deals:**

- Must contain 25 deals unless fewer than 25 deals exist within 10km radius
- Must be populated by `scripts/post-data-refresh.ts` after any database update
- `active_happy_hours` collection should be prioritized above all others
- Should include a mix of deal types with the best available deals

**How to verify:**
1. Run: `npx tsx scripts/post-data-refresh.ts` after any database update
2. Check the database directly: `SELECT COUNT(*) FROM deals WHERE collections LIKE '%active_happy_hours%'`
3. Verify API response: `/api/deals/collections/active_happy_hours` should return 25 deals

## 3. Collection Display Priority on Home Page

**Use these EXACT priority values for collections:**

| Collection | Priority Range |
|------------|---------------|
| "Active Happy Hours" | 1 |
| "All Deals" | 2 |
| Beers Under $12 | 10-13 |
| Wines Under $12 | 10-13 |
| Cocktails under $12 | 10-13 |
| 1-for-1 deals | 15-19 |
| Freeflow deals | 15-19 |
| Cocktails under $15 | 20-22 |
| Wines Under $15 | 20-22 |
| Beer Bucket | 22-25 |
| Beers Under $15 | 25-30 |
| Spirit collections (Whisky, Gin) | 40-41 |
| "All Deals" | 60 |

**Where to set these values:**
- In the database `collections` table
- Via API: `POST /api/collections` or `PATCH /api/collections/:id`
- In `scripts/post-data-refresh.ts` - The `updateCollectionPriorities` function

## Post-Database Refresh Procedure

1. **Run the post-data refresh script:**
   ```
   npx tsx scripts/post-data-refresh.ts
   ```

2. **Verify Happy Hours Nearby collection:**
   ```
   curl http://localhost:5000/api/deals/collections/active_happy_hours | jq length
   ```
   (Should return 25 unless fewer deals exist within 10km)

3. **Verify collection priorities:**
   ```
   curl http://localhost:5000/api/collections | jq 'sort_by(.priority)'
   ```
   (Should match the priority table above)

4. **Test the application:**
   - Load the home page and verify "Happy Hours Nearby" appears first
   - Verify deals within collections are properly sorted (active deals first)
   - Check that all collections appear in the correct order

## Common Issues and Fixes

- If "Happy Hours Nearby" is missing deals, run `npx tsx scripts/post-data-refresh.ts`
- If collections are out of order, check the database priorities
- If deal sorting is incorrect, verify the 6-step sorting logic in both server and client code

Remember: ALWAYS run the post-data refresh procedure after ANY update to deals or establishments!