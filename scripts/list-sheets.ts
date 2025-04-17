/**
 * Script to list all sheets in a Google Spreadsheet
 * Run with: npx tsx scripts/list-sheets.ts
 */
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

// The spreadsheet ID
const SPREADSHEET_ID = '1mvmQLAe326ABsIfe2m1dZDd8StlrZrBKjujcT4nGpy0';

async function listSheets() {
  try {
    console.log(`Checking Google Sheets spreadsheet ID: ${SPREADSHEET_ID}`);
    
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
    
    // Fetch spreadsheet info
    console.log(`Fetching spreadsheet info...`);
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    
    const spreadsheet = response.data;
    console.log(`Spreadsheet title: ${spreadsheet.properties?.title}`);
    
    // List all sheets
    if (spreadsheet.sheets && spreadsheet.sheets.length > 0) {
      console.log(`\nSheets in this spreadsheet:`);
      spreadsheet.sheets.forEach((sheet, index) => {
        console.log(`${index + 1}. ${sheet.properties?.title} (ID: ${sheet.properties?.sheetId})`);
      });
    } else {
      console.log(`No sheets found in this spreadsheet.`);
    }
    
    console.log(`\nCheck completed successfully!`);
  } catch (error) {
    console.error('Error checking Google Sheets:', error);
  }
}

// Run the check
listSheets().then(() => {
  console.log('All done!');
}).catch(error => {
  console.error('Script failed:', error);
});