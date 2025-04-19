# How to Refresh Deals Data

This guide explains how to refresh your deals data from Google Sheets while preserving all existing application logic.

## Prerequisites

Make sure you have the following environment variables set in your `.env` file:

```
GOOGLE_SHEETS_SPREADSHEET_ID=your_google_sheet_id
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email
GOOGLE_SHEETS_PRIVATE_KEY=your_private_key
```

## Steps to Refresh Deals

1. **Run the refresh script**:

   ```bash
   # Make the script executable (first time only)
   chmod +x refresh-deals.sh
   
   # Run the refresh script
   ./refresh-deals.sh
   ```

   Alternatively, you can run the TypeScript file directly:

   ```bash
   npx tsx scripts/refresh-deals-data.ts
   ```

2. **Restart the application**:

   After the refresh completes, restart the application to see the updated deals data.

## What the Refresh Script Does

The refresh script does the following:

1. Loads all existing deals from the database
2. Fetches the latest deal data from Google Sheets
3. Updates existing deals with new information (prices, times, descriptions)
4. Preserves all existing deal attributes that should not change
5. Maintains all existing logic for deal display and filtering

## Troubleshooting

If you encounter any issues:

1. Check that your Google Sheets credentials are correct
2. Verify that the spreadsheet structure matches what the script expects
3. Review the error messages displayed during the refresh process

For more complex issues, you can modify the `scripts/refresh-deals-data.ts` file to address specific requirements.