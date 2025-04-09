/**
 * Simple script to test Google Sheets connection
 * 
 * Run with:
 * npx tsx server/testGoogleSheets.ts
 */

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function testConnection() {
  // Get environment variables
  let SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
  const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '';
  const PRIVATE_KEY = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  
  // Extract the spreadsheet ID from the URL if necessary
  if (SPREADSHEET_ID.includes('docs.google.com/spreadsheets/d/')) {
    const match = SPREADSHEET_ID.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      SPREADSHEET_ID = match[1];
      console.log(`Extracted spreadsheet ID from URL: ${SPREADSHEET_ID}`);
    }
  }
  
  console.log('Testing Google Sheets connection...');
  console.log(`Spreadsheet ID: ${SPREADSHEET_ID ? SPREADSHEET_ID : '✗ Missing'}`);
  console.log(`Client Email: ${CLIENT_EMAIL ? '✓ Available' : '✗ Missing'}`);
  console.log(`Private Key: ${PRIVATE_KEY ? '✓ Available (Length: ' + PRIVATE_KEY.length + ' chars)' : '✗ Missing'}`);
  
  if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    console.error('\n❌ Missing required environment variables for Google Sheets API');
    console.log('\nPlease make sure the following environment variables are set:');
    console.log('- GOOGLE_SHEETS_SPREADSHEET_ID');
    console.log('- GOOGLE_SHEETS_CLIENT_EMAIL');
    console.log('- GOOGLE_SHEETS_PRIVATE_KEY');
    return false;
  }
  
  try {
    // Set up JWT auth
    const serviceAccountAuth = new JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    // Initialize the document
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    
    // Try to load document info
    await doc.loadInfo();
    
    console.log('\n✅ Successfully connected to Google Sheet!');
    console.log(`Title: ${doc.title}`);
    
    // List all sheet titles
    const sheetTitles = Object.keys(doc.sheetsByTitle);
    console.log(`\nAvailable sheets (${sheetTitles.length}):`);
    sheetTitles.forEach(title => {
      console.log(`- ${title}`);
    });
    
    // Check for required sheets
    const hasEstablishmentsSheet = sheetTitles.includes('Establishments');
    const hasDealsSheet = sheetTitles.includes('Deals');
    
    if (hasEstablishmentsSheet && hasDealsSheet) {
      console.log('\n✅ Required sheets found (Establishments, Deals)');
    } else {
      console.log('\n⚠️ Missing required sheets:');
      if (!hasEstablishmentsSheet) console.log('- Missing "Establishments" sheet');
      if (!hasDealsSheet) console.log('- Missing "Deals" sheet');
      console.log('\nPlease create these sheets in your Google Spreadsheet.');
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Error connecting to Google Sheets:');
    console.error(error);
    return false;
  }
}

// Run the test
testConnection();