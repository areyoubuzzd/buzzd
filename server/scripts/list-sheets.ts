/**
 * Script to list all sheets in the Google Sheets document
 */

import 'dotenv/config';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Environment variables for Google Sheets API
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  throw new Error('Missing Google Sheets credentials in environment variables');
}

// JWT auth for Google Sheets API
const serviceAccountAuth = new JWT({
  email: CLIENT_EMAIL,
  key: PRIVATE_KEY,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ],
});

async function listSheets() {
  try {
    // Initialize the spreadsheet
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    
    // Load document properties and sheets
    await doc.loadInfo();
    
    console.log(`Successfully connected to spreadsheet: "${doc.title}"`);
    console.log('\nAvailable sheets:');
    
    // List all sheets
    const sheets = doc.sheetsByIndex;
    for (const [index, sheet] of sheets.entries()) {
      console.log(`${index + 1}. ${sheet.title} (${sheet.rowCount} rows x ${sheet.columnCount} columns)`);
      
      // Load the first row to see headers for each sheet
      try {
        const rows = await sheet.getRows({ limit: 1 });
        if (rows.length > 0) {
          console.log(`   Headers: ${Object.keys(rows[0].toObject()).join(', ')}`);
        } else {
          console.log('   No data rows found');
        }
      } catch (err) {
        console.log(`   Error getting headers: ${err.message}`);
      }
      
      console.log(''); // Add empty line for readability
    }
    
  } catch (error) {
    console.error('Error listing sheets:', error);
  }
}

listSheets();