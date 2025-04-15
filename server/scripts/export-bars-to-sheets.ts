/**
 * Script to export bars from the database to Google Sheets
 * This helps maintain the Google Sheets as a source of truth for the application
 */

import 'dotenv/config';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { db } from '../db';
import { establishments } from '../../shared/schema';

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
    
    // Get or create the "Restaurants" sheet
    let restaurantsSheet = doc.sheetsByTitle['Restaurants'];
    
    if (!restaurantsSheet) {
      console.log('Creating new "Restaurants" sheet...');
      restaurantsSheet = await doc.addSheet({
        title: 'Restaurants',
        headerValues: [
          'name',
          'external_id',
          'address',
          'city',
          'postal_code',
          'latitude',
          'longitude',
          'image_url',
          'rating',
          'cuisine',
          'price'
        ]
      });
      console.log('Created "Restaurants" sheet');
    } else {
      console.log('Using existing "Restaurants" sheet');
    }
    
    // Fetch all bars from the database with external_id starting with SG0
    const bars = await db.select().from(establishments)
      .where(establishments => 
        establishments.external_id.like('SG0%')
      );
    
    console.log(`Found ${bars.length} bars to export`);
    
    // Check if bars are already in the sheet
    const existingRows = await restaurantsSheet.getRows();
    const existingExternalIds = new Set(existingRows.map(row => row.get('external_id')));
    
    // Prepare new bars for export
    const newBars = bars.filter(bar => !existingExternalIds.has(bar.external_id));
    
    if (newBars.length === 0) {
      console.log('No new bars to export - all bars are already in the sheet');
      return;
    }
    
    console.log(`Exporting ${newBars.length} new bars to sheet...`);
    
    // Format bars data for Google Sheets
    const barsForSheet = newBars.map(bar => ({
      name: bar.name,
      external_id: bar.external_id,
      address: bar.address,
      city: bar.city,
      postal_code: bar.postalCode,
      latitude: bar.latitude,
      longitude: bar.longitude,
      image_url: bar.imageUrl,
      rating: bar.rating,
      cuisine: bar.cuisine,
      price: bar.price
    }));
    
    // Add bars to sheet
    await restaurantsSheet.addRows(barsForSheet);
    
    console.log(`Successfully exported ${newBars.length} bars to Google Sheets`);
    console.log(`Google Sheets document: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);
    
  } catch (error) {
    console.error('Error exporting bars to Google Sheets:', error);
  }
}

// Run the export function
exportBarsToSheet().catch(console.error);