/**
 * Script to directly import deals from Google Sheets to the database
 * without requiring schema migrations
 * 
 * This script bypasses the interactive drizzle-kit push command and
 * directly imports deals using the current schema
 */

import 'dotenv/config';
import { getDealsFromSheets, syncDealsFromSheets } from '../services/googleSheetsService';

async function importDeals() {
  try {
    console.log("===========================");
    console.log("Direct Deals Import Script");
    console.log("===========================");
    console.log("");
    
    // First test the connection and get the deal data
    console.log("Step 1: Testing connection to Google Sheets...");
    const dealsData = await getDealsFromSheets();
    console.log(`Found ${dealsData.length} deals in Google Sheets`);
    
    if (dealsData.length === 0) {
      console.error("No deals found in Google Sheets. Please make sure the 'Deals' sheet exists and has data.");
      process.exit(1);
    }
    
    // Display sample data
    console.log("\nHere's the first few deals for preview:");
    for (let i = 0; i < Math.min(3, dealsData.length); i++) {
      console.log(`\nDeal #${i + 1}:`);
      console.log(JSON.stringify(dealsData[i], null, 2));
    }
    
    // Import the deals directly
    console.log("\nStep 2: Importing deals into the database...");
    
    // Ask for confirmation
    if (process.argv.includes('--import')) {
      const results = await syncDealsFromSheets();
      console.log(`Successfully imported ${results.length} deals to the database!`);
    } else {
      console.log("\nTo import the deals, run this script with the --import flag:");
      console.log("  npx tsx server/scripts/import-deals-direct.ts --import");
    }
    
    console.log("\nScript completed!");
  } catch (error) {
    console.error('Error importing deals:', error);
    process.exit(1);
  }
}

// Run the script
importDeals();