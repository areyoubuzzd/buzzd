/**
 * Test script to import deals from Google Sheets with the new simplified schema
 * 
 * Run with:
 * npx tsx server/scripts/test-deals-import.ts
 */

import 'dotenv/config';
import { getDealsFromSheets, syncDealsFromSheets } from '../services/googleSheetsService';
import { db } from '../db';
import { deals } from '../../shared/schema';

async function testConnection() {
  try {
    console.log("Testing connection to Google Sheets...");
    
    // Test reading from the sheet
    const dealsData = await getDealsFromSheets();
    console.log(`Found ${dealsData.length} deals in Google Sheets`);
    
    if (dealsData.length > 0) {
      console.log("\nHere's the first deal in the sheet:");
      console.log(JSON.stringify(dealsData[0], null, 2));
      
      // Get current count of deals in the database
      const dbDeals = await db.select({ count: deals.id }).from(deals);
      console.log(`\nCurrent deal count in database: ${dbDeals.length}`);
      
      // Ask for confirmation before import
      console.log("\nWould you like to import these deals into the database? (Run this script with --import flag)");
      
      // If --import flag is provided, run the import
      if (process.argv.includes('--import')) {
        console.log("\nImporting deals...");
        const importedDeals = await syncDealsFromSheets();
        console.log(`Successfully imported ${importedDeals.length} deals!`);
      }
    } else {
      console.log("No deals found in Google Sheets. Please make sure your Google Sheet has data and is correctly formatted.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to Google Sheets:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();