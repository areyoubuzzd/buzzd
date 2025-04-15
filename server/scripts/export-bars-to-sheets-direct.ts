/**
 * Script to export bars from the database to Google Sheets
 * This helps maintain the Google Sheets as a source of truth for the application
 */

import 'dotenv/config';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { pool } from '../db';

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

// Initialize the spreadsheet
const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

async function exportBarsToSheet() {
  try {
    console.log('Starting export of bars to Google Sheets...');
    
    // Load the document
    await doc.loadInfo();
    console.log(`Loaded document: ${doc.title}`);
    
    // Try to use the first sheet in the spreadsheet which should be the "Sheet1" or main data sheet
    const mainSheet = doc.sheetsByIndex[0];
    if (!mainSheet) {
      console.error('Could not find the first sheet in the spreadsheet');
      return;
    }
    
    console.log(`Using sheet: ${mainSheet.title}`);
    
    // Get the column headers
    const headerRows = await mainSheet.getRows({ limit: 1 });
    if (headerRows.length === 0) {
      console.error('Sheet has no data or headers');
      return;
    }
    
    // Get column headers
    const headers = headerRows[0].toObject();
    console.log('Sheet headers:', Object.keys(headers));
    
    // Connect to the database directly with the pool
    const client = await pool.connect();
    try {
      // Fetch all bars from the database with external_id starting with SG0
      const result = await client.query(`
        SELECT * FROM establishments 
        WHERE external_id LIKE 'SG0%'
      `);
      const bars = result.rows;
      
      console.log(`Found ${bars.length} bars to export`);
      
      // Check if bars are already in the sheet
      const existingRows = await mainSheet.getRows();
      
      // Create a map of existing external IDs
      const existingExternalIds = new Set();
      for (const row of existingRows) {
        const rowObj = row.toObject();
        if (rowObj.external_id || rowObj.establishment_id) {
          existingExternalIds.add(rowObj.external_id || rowObj.establishment_id);
        }
      }
      
      console.log(`Found ${existingExternalIds.size} existing external IDs in sheet`);
      
      // Prepare new bars for export
      const newBars = bars.filter(bar => 
        bar.external_id && !existingExternalIds.has(bar.external_id)
      );
      
      if (newBars.length === 0) {
        console.log('No new bars to export - all bars are already in the sheet');
        return;
      }
      
      console.log(`Exporting ${newBars.length} new bars to sheet...`);
      
      // Format bars data for Google Sheets, handling null values and using proper string conversion
      const rows = [];
      
      for (const bar of newBars) {
        // Create a row that matches the Google Sheets expected format
        const rowData: Record<string, string> = {};
        
        // Use field mapping based on your actual column names
        // Only add fields if they exist in the headers and the bar has a value
        if ('name' in headers && bar.name) rowData.name = bar.name;
        if ('external_id' in headers && bar.external_id) rowData.external_id = bar.external_id;
        if ('establishment_id' in headers && bar.external_id) rowData.establishment_id = bar.external_id;
        if ('address' in headers && bar.address) rowData.address = bar.address;
        if ('city' in headers && bar.city) rowData.city = bar.city;
        if ('postal_code' in headers && bar.postal_code) rowData.postal_code = bar.postal_code;
        if ('postal_code' in headers && bar.postalcode) rowData.postal_code = bar.postalcode;
        if ('latitude' in headers && bar.latitude !== null) rowData.latitude = bar.latitude.toString();
        if ('longitude' in headers && bar.longitude !== null) rowData.longitude = bar.longitude.toString();
        if ('image_url' in headers && bar.image_url) rowData.image_url = bar.image_url;
        if ('image_url' in headers && bar.imageurl) rowData.image_url = bar.imageurl;
        if ('rating' in headers && bar.rating !== null) rowData.rating = bar.rating.toString();
        if ('cuisine' in headers && bar.cuisine) rowData.cuisine = bar.cuisine;
        if ('price' in headers && bar.price !== null) rowData.price = bar.price.toString();
        
        rows.push(rowData);
      }
      
      // Add each row individually for better error handling
      console.log('Adding rows to spreadsheet...');
      if (rows.length > 0) {
        for (const row of rows) {
          try {
            await mainSheet.addRow(row);
            console.log(`Added row for: ${row.name || 'unknown'}`);
          } catch (error) {
            console.error(`Error adding row for ${row.name || 'unknown'}:`, error);
          }
        }
      }
      
      console.log(`Successfully exported ${newBars.length} bars to Google Sheets`);
      console.log(`Google Sheets document: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
      
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error exporting bars to Google Sheets:', error);
  }
}

// Run the export function
exportBarsToSheet().catch(console.error);