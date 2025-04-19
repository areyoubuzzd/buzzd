# How to Refresh Deals Data

This guide explains how to refresh your deals data from Google Sheets while preserving all existing application logic.

## Prerequisites

Make sure you have the following environment variables set in your `.env` file:

```
GOOGLE_SHEETS_SPREADSHEET_ID=1mvmQLAe326ABsIfe2m1dZDd8StlrZrBKjujcT4nGpy0
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email
GOOGLE_SHEETS_PRIVATE_KEY=your_private_key
```

## Steps to Refresh Deals

### Method 1: Using the import-from-gsheets script

1. **Run the import script**:

   ```bash
   # Check which tab names are available in your spreadsheet
   npx tsx scripts/list-sheets.ts
   
   # Import from the "Deals" tab (or whatever your tab is named)
   npx tsx scripts/import-from-gsheets.ts 1mvmQLAe326ABsIfe2m1dZDd8StlrZrBKjujcT4nGpy0 Deals
   ```

   Replace `Deals` with your actual tab name from the spreadsheet.

2. **Restart the application**:

   After the import completes, restart the application to see the updated deals data.

### Method 2: Using import-deals script

If you want to use the dedicated deals import script:

```bash
npx tsx scripts/import-deals.ts
```

This script is specifically designed for the deals table and may have specialized logic.

### Method 3: Using import-deals-batch script (for large datasets)

If you have a large number of deals, the batch import script can help avoid timeouts:

```bash
npx tsx scripts/import-deals-batch.ts
```

## Verifying the Import

After importing, you can verify that the data was successfully imported by:

1. Checking the console output for any errors
2. Refreshing the application and verifying deals are displayed correctly
3. Checking that active/inactive status is working properly

## Troubleshooting

If you encounter any issues:

1. Check that your Google Sheets credentials are correct and up to date
2. Verify that the spreadsheet structure matches what the import script expects:
   - Make sure column headers match the expected field names
   - Check that date formats are consistent
   - Ensure all required fields have values
3. Review the error messages displayed during the import process

## Important Notes

- The import preserves all existing logic for deal display and filtering
- Deal images will not be affected by the data refresh
- The spreadsheet ID `1mvmQLAe326ABsIfe2m1dZDd8StlrZrBKjujcT4nGpy0` is already configured