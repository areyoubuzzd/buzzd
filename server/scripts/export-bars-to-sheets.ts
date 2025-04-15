/**
 * Script to export bars from the database to Google Sheets
 * This helps maintain the Google Sheets as a source of truth for the application
 */

import 'dotenv/config';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { db } from '../db';
import { establishments } from '../../shared/schema';
import { eq } from 'drizzle-orm';

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
    
    // Fetch all bars from the database with external_id starting with SG0
    // Use the plain SQL query since the previous approach had TypeScript errors
    const bars = await db.query.establishments.findMany({
      where: (establishments, { like }) => like(establishments.external_id, 'SG0%')
    });
    
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
    
    // Format bars data for Google Sheets, using the exact column names from the sheet
    const rows = newBars.map(bar => {
      const row: Record<string, any> = {};
      
      // Map the database field names to spreadsheet column names
      if (headers.name !== undefined) row.name = bar.name;
      if (headers.external_id !== undefined) row.external_id = bar.external_id;
      if (headers.establishment_id !== undefined) row.establishment_id = bar.external_id;
      if (headers.address !== undefined) row.address = bar.address;
      if (headers.city !== undefined) row.city = bar.city;
      if (headers.postal_code !== undefined) row.postal_code = bar.postalCode;
      if (headers.postalCode !== undefined) row.postalCode = bar.postalCode;
      if (headers.latitude !== undefined) row.latitude = bar.latitude.toString();
      if (headers.longitude !== undefined) row.longitude = bar.longitude.toString();
      if (headers.image_url !== undefined) row.image_url = bar.imageUrl;
      if (headers.imageUrl !== undefined) row.imageUrl = bar.imageUrl;
      if (headers.rating !== undefined) row.rating = bar.rating?.toString() || '';
      if (headers.cuisine !== undefined) row.cuisine = bar.cuisine;
      if (headers.price !== undefined) row.price = bar.price?.toString() || '';
      
      return row;
    });
    
    // Add bars to sheet
    console.log('Adding rows to spreadsheet...');
    await mainSheet.addRows(rows);
    
    console.log(`Successfully exported ${newBars.length} bars to Google Sheets`);
    console.log(`Google Sheets document: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
    
  } catch (error) {
    console.error('Error exporting bars to Google Sheets:', error);
  }
}

// Run the export function
exportBarsToSheet().catch(console.error);