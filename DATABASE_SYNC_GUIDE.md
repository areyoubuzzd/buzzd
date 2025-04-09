# Database Sync Guide: Google Sheets to PostgreSQL

This guide explains how to populate your PostgreSQL database with data from Google Sheets.

## Prerequisites

1. Make sure you have configured the following environment secrets:
   - `GOOGLE_SHEETS_CLIENT_EMAIL`: The service account email from Google Cloud
   - `GOOGLE_SHEETS_PRIVATE_KEY`: The private key for the service account
   - `GOOGLE_SHEETS_SPREADSHEET_ID`: The ID of your Google Spreadsheet
   - `DATABASE_URL`: Your PostgreSQL database connection string

2. Ensure your Google Sheet has the following structure:

### Establishments Sheet

Your sheet named "Establishments" should have the following columns:
- name
- description
- address
- city
- postalCode
- latitude (number)
- longitude (number)
- imageUrl (optional)
- rating (optional, number)
- type

### Deals Sheet

Your sheet named "Deals" should have the following columns:
- establishmentName (must match an establishment name in the Establishments sheet)
- title
- description
- status (active, upcoming, or inactive)
- type (drink, food, or both)
- drinkCategory (if type is drink: beer, wine, cocktail, spirits, or non_alcoholic)
- drinkSubcategory (optional, subcategory of the drink)
- isHousePour (true/false)
- brand (optional)
- servingStyle (glass, bottle, pint, flight, or bucket)
- servingSize (e.g., "330ml", "750ml", "1 pint")
- regularPrice (number)
- dealPrice (number)
- isOneForOne (true/false)
- startTime (ISO date string)
- endTime (ISO date string)
- daysOfWeek (comma-separated list of days: 0=Sunday, 1=Monday, etc.)
- imageUrl (optional)

## Syncing the Database

### Using the Command Line Script

We've provided a simple shell script to sync data from Google Sheets to your database:

```bash
# Sync both establishments and deals
./db-sync.sh all

# Sync only establishments
./db-sync.sh establishments

# Sync only deals
./db-sync.sh deals
```

### Running the TypeScript Directly

If you prefer, you can run the TypeScript files directly:

```bash
# Sync everything
npx tsx server/scripts/sync-database.ts

# Sync only establishments
npx tsx -e "import { syncEstablishmentsFromSheets } from './server/services/googleSheetsService'; syncEstablishmentsFromSheets().then(console.log).catch(console.error);"

# Sync only deals
npx tsx -e "import { syncDealsFromSheets } from './server/services/googleSheetsService'; syncDealsFromSheets().then(console.log).catch(console.error);"
```

## How the Sync Process Works

1. The sync process first reads data from your Google Sheet
2. For establishments:
   - If an establishment with the same name already exists, it updates it
   - Otherwise, it inserts a new establishment
3. For deals:
   - The process maps each deal to an establishment based on the establishment name
   - It calculates savings percentage automatically
   - If a deal with the same title and establishment already exists, it updates it
   - Otherwise, it inserts a new deal

## Troubleshooting

If you encounter issues with the sync process:

1. Verify your Google Sheets credentials are correct
2. Check that your spreadsheet has the proper sheets and column names
3. Ensure that each deal's establishmentName matches exactly with an establishment name
4. Check the console output for specific error messages