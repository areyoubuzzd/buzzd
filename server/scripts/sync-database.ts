import { syncAllDataFromSheets, syncEstablishmentsFromSheets, syncDealsFromSheets } from "../services/googleSheetsService";

/**
 * This script syncs data from Google Sheets to the PostgreSQL database
 * Run it with:
 * npx tsx server/scripts/sync-database.ts
 */

async function main() {
  try {
    console.log('Starting database sync from Google Sheets...');
    
    console.log('Syncing establishments...');
    const establishments = await syncEstablishmentsFromSheets();
    console.log(`Synced ${establishments.length} establishments successfully`);
    
    console.log('Syncing deals...');
    const deals = await syncDealsFromSheets();
    console.log(`Synced ${deals.length} deals successfully`);
    
    console.log('Database sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
}

// Run the script
main();