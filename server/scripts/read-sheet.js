/**
 * Simple script to read from Google Sheets using the raw API
 */

import { google } from 'googleapis';

// Get environment variables
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
// Replace escaped newlines with actual newlines
const PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n');

// Create a JWT auth client
const jwtClient = new google.auth.JWT(
  CLIENT_EMAIL,
  null,
  PRIVATE_KEY,
  ['https://www.googleapis.com/auth/spreadsheets.readonly']
);

// Create sheets API client
const sheets = google.sheets({ version: 'v4', auth: jwtClient });

async function main() {
  try {
    console.log('Authenticating with Google...');
    
    // Authorize the client
    await jwtClient.authorize();
    console.log('Successfully authenticated!');
    
    console.log(`Reading spreadsheet with ID: ${SPREADSHEET_ID}`);
    
    // Get spreadsheet info
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    
    console.log(`Spreadsheet title: ${spreadsheet.data.properties.title}`);
    console.log('Sheets in this spreadsheet:');
    
    const sheetNames = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
    sheetNames.forEach(name => console.log(`- ${name}`));
    
    // Get the first sheet (assuming it's the restaurant sheet)
    const sheetTitle = sheetNames[0];
    console.log(`\nReading data from sheet: ${sheetTitle}`);
    
    // Get the sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetTitle}!A1:Z`,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in sheet.');
      return;
    }
    
    // Extract headers and data
    const headers = rows[0];
    const data = rows.slice(1);
    
    console.log(`Found ${data.length} rows of data with ${headers.length} columns`);
    console.log('\nHeaders:');
    console.log(headers);
    
    // Display first 2 rows as samples
    console.log('\nSample data (first 2 rows):');
    data.slice(0, 2).forEach((row, i) => {
      const rowObj = {};
      headers.forEach((header, j) => {
        rowObj[header] = row[j];
      });
      console.log(`Row ${i + 1}:`, rowObj);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();