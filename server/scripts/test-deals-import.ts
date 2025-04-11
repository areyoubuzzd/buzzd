/**
 * Test script to import deals from Google Sheets with the new simplified schema
 * 
 * Run with:
 * npx tsx server/scripts/test-deals-import.ts
 */

import 'dotenv/config';
import { getDealsFromSheets } from '../services/googleSheetsService';

async function testConnection() {
  try {
    console.log("Testing connection to Google Sheets...");
    
    // Test reading from the sheet
    const dealsData = await getDealsFromSheets();
    console.log(`Found ${dealsData.length} deals in Google Sheets`);
    
    if (dealsData.length > 0) {
      console.log("\nHere's the first 3 deals in the sheet:");
      
      // Display first 3 deals for preview
      for (let i = 0; i < Math.min(3, dealsData.length); i++) {
        console.log(`\nDeal #${i + 1}:`);
        console.log(JSON.stringify(dealsData[i], null, 2));
      }
      
      console.log("\nGoogle Sheets connection successful! You can now use the database sync endpoints to import this data.");
      console.log("POST /api/db/sync/deals - Requires admin authentication");
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