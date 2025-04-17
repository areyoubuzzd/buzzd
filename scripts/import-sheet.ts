/**
 * Script to import data from Google Sheets using v4 API
 * Run with: npx tsx scripts/import-sheet.ts
 */
import { GoogleAuth } from 'google-auth-library';
import { google, sheets_v4 } from 'googleapis';
import { db } from '../server/db';
import {
  establishments,
  type InsertEstablishment
} from '../shared/schema';

// The spreadsheet ID and range
const SPREADSHEET_ID = '1mvmQLAe326ABsIfe2m1dZDd8StlrZrBKjujcT4nGpy0';
const RANGE = 'restaurants!A:L'; // This will read all columns from A to L in the "restaurants" sheet

async function importRestaurants() {
  try {
    console.log(`Starting import from Google Sheets spreadsheet ID: ${SPREADSHEET_ID}`);
    
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
    
    // Fetch data from the sheet
    console.log(`Fetching data from range: ${RANGE}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.error('No data found in the spreadsheet.');
      return;
    }
    
    console.log(`Found ${rows.length} rows in the spreadsheet.`);
    
    // First row is the header row
    const headers = rows[0];
    console.log(`Headers: ${headers.join(', ')}`);
    
    // Process the remaining rows (data)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) {
        continue;
      }
      
      // Create an object from the row using the headers as keys
      const restaurant: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (index < row.length) {
          restaurant[header] = row[index];
        } else {
          restaurant[header] = null; // Handle missing values
        }
      });
      
      // Log raw data for debugging
      console.log(`Processing row ${i}: ${JSON.stringify(restaurant)}`);
      
      // Map to our schema
      try {
        // Handle different possible column names
        const restaurantId = restaurant.restaurant_id || restaurant.id || '';
        const restaurantName = restaurant.restaurant_name || restaurant.name || '';
        const fullAddress = restaurant.full_address || restaurant.address || '';
        const areaName = restaurant.area || restaurant.city || '';
        const postalCode = restaurant.postalCode || restaurant.postal_code || '';
        const lat = restaurant.latitude || restaurant.lat || 0;
        const lng = restaurant.longitude || restaurant.lng || 0;
        const cuisineType = restaurant.cuisine || '';
        const logo = restaurant.logoUrl || restaurant.logo_url || '';
        
        const establishmentData: Partial<InsertEstablishment> = {
          external_id: restaurantId.toString(),
          name: restaurantName,
          address: fullAddress,
          city: areaName,
          postalCode: postalCode.toString(),
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          cuisine: cuisineType,
          imageUrl: logo,
          description: `${restaurantName} - Restaurant in Singapore`,
        };
        
        // Skip if missing essential data
        if (!establishmentData.name || establishmentData.name.trim() === '') {
          console.warn(`Skipping restaurant with missing name:`, restaurant);
          continue;
        }
        
        // Skip if missing latitude/longitude
        if (isNaN(establishmentData.latitude!) || isNaN(establishmentData.longitude!)) {
          console.warn(`Skipping restaurant with invalid coordinates:`, restaurant.restaurant_name);
          continue;
        }
        
        // Insert into database
        const [inserted] = await db.insert(establishments).values(establishmentData as InsertEstablishment).returning();
        
        console.log(`Imported: ${inserted.name} (${inserted.id}) - External ID: ${inserted.external_id || 'none'}`);
      } catch (error) {
        console.error(`Error importing restaurant row ${i}:`, error);
        console.error('Row data:', restaurant);
      }
    }
    
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error importing data from Google Sheets:', error);
  }
}

// Run the import
importRestaurants().then(() => {
  console.log('All done!');
}).catch(error => {
  console.error('Script failed:', error);
});