/**
 * Script to check the Google spreadsheet and list all available sheets
 */

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import 'dotenv/config';

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

async function checkSpreadsheet() {
  try {
    console.log(`Checking Google Spreadsheet ID: ${SPREADSHEET_ID}`);
    
    // Initialize the spreadsheet
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    
    // Load the document properties and sheets
    await doc.loadInfo();
    
    console.log(`\nSpreadsheet title: "${doc.title}"`);
    console.log(`Total sheets: ${doc.sheetCount}`);
    
    // List all sheets
    console.log("\nAvailable sheets:");
    doc.sheetsByIndex.forEach((sheet, index) => {
      console.log(`${index + 1}. "${sheet.title}" (${sheet.rowCount} rows x ${sheet.columnCount} columns)`);
    });
    
    // Check if "Deals" sheet exists
    const dealsSheet = doc.sheetsByTitle['Deals'];
    if (dealsSheet) {
      console.log('\n✅ "Deals" sheet exists!');
      
      // Load a sample row to see the columns
      const rows = await dealsSheet.getRows({ limit: 1 });
      
      if (rows.length > 0) {
        console.log("\nSample row data from Deals sheet:");
        console.log(rows[0].toObject());
      } else {
        console.log("\nThe Deals sheet appears to be empty or has only headers.");
      }
    } else {
      console.log('\n❌ "Deals" sheet not found! You need to create a sheet named "Deals" in this spreadsheet.');
    }
    
    // Check what's in Sheet2
    const sheet2 = doc.sheetsByTitle['Sheet2'];
    if (sheet2) {
      console.log('\n\nExamining "Sheet2":');
      
      // Load a sample row to see the columns
      const rows = await sheet2.getRows({ limit: 5 });
      
      if (rows.length > 0) {
        console.log(`\nSample data from Sheet2 (${rows.length} rows):`);
        console.log("First row headers:", Object.keys(rows[0].toObject()));
        rows.forEach((row, i) => {
          console.log(`\nRow ${i+1} data:`, row.toObject());
        });
      } else {
        console.log("\nSheet2 appears to be empty or has only headers.");
      }
    }
  } catch (error) {
    console.error('Error checking spreadsheet:', error);
  }
}

checkSpreadsheet();