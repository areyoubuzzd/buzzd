/**
 * Script to check which establishments are actually in the Google Sheet
 * 
 * Run with: npx tsx scripts/check-google-sheet-entries.ts
 */

import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// The spreadsheet ID and range
const SPREADSHEET_ID = '1mvmQLAe326ABsIfe2m1dZDd8StlrZrBKjujcT4nGpy0';
const RANGE = 'deals!A:P'; // This will read all columns from A to P in the "deals" sheet

async function checkGoogleSheetEntries() {
  console.log(`Analyzing deals in Google Sheets spreadsheet ID: ${SPREADSHEET_ID}`);
  
  try {
    // Create a JWT auth client
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    // Create sheets client
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Fetch data from the spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
    
    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      throw new Error('No data found in spreadsheet');
    }
    
    console.log(`Found ${rows.length - 1} rows of data (excluding header)`);
    
    // Extract headers and data rows
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    // Find establishment_id column index
    const estIdIndex = headers.findIndex(h => 
      h.toLowerCase() === 'establishment_id' || 
      h.toLowerCase() === 'restaurant_id'
    );
    
    if (estIdIndex === -1) {
      throw new Error('Could not find establishment_id or restaurant_id column in the sheet');
    }
    
    // Count how many deals each establishment has
    const establishmentCounts = new Map<string, number>();
    
    for (const row of dataRows) {
      const establishmentId = row[estIdIndex];
      
      if (establishmentId) {
        establishmentCounts.set(
          establishmentId, 
          (establishmentCounts.get(establishmentId) || 0) + 1
        );
      }
    }
    
    // Print the results
    console.log('\nEstablishment deal counts in the Google Sheet:');
    console.log('----------------------------------------------');
    
    const sortedEntries = Array.from(establishmentCounts.entries())
      .sort((a, b) => b[1] - a[1]); // Sort by count in descending order
    
    for (const [establishmentId, count] of sortedEntries) {
      console.log(`${establishmentId}: ${count} deals`);
    }
    
    // Check if there are establishments with no deals
    console.log('\nEstablishment IDs in the sheet:');
    console.log(Array.from(establishmentCounts.keys()).sort().join(', '));
    
  } catch (error) {
    console.error('Error analyzing Google Sheets data:', error);
  }
}

// Run the analysis
checkGoogleSheetEntries().then(() => {
  console.log('\nAnalysis completed!');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});