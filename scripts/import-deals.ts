/**
 * Script to import deals data from Google Sheets using v4 API
 * Run with: npx tsx scripts/import-deals.ts
 */
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { db } from '../server/db';
import {
  establishments,
  deals,
  type InsertDeal
} from '../shared/schema';

// The spreadsheet ID and range
const SPREADSHEET_ID = '1mvmQLAe326ABsIfe2m1dZDd8StlrZrBKjujcT4nGpy0';
const RANGE = 'deals!A:P'; // This will read all columns from A to P in the "deals" sheet

async function importDeals() {
  try {
    console.log(`Starting import from Google Sheets spreadsheet ID: ${SPREADSHEET_ID}`);
    
    // First, get all establishments to create ID mapping
    const existingEstablishments = await db.select().from(establishments);
    const idMapping = new Map<string, number>();
    
    // Create mapping from external_id to database id
    existingEstablishments.forEach(est => {
      if (est.external_id) {
        idMapping.set(est.external_id, est.id);
        console.log(`Mapped establishment: ${est.name} (${est.external_id} → DB ID: ${est.id})`);
      }
    });
    
    console.log(`Created mapping for ${idMapping.size} establishments`);
    
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
      const deal: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (index < row.length) {
          deal[header] = row[index];
        } else {
          deal[header] = null; // Handle missing values
        }
      });
      
      // Log raw data for debugging
      console.log(`Processing row ${i}: ${JSON.stringify(deal)}`);
      
      // Map to our schema
      try {
        // Normalize column names (remove spaces, handle both formats)
        const normalizedDeal: Record<string, any> = {};
        // Convert all keys to lowercase and remove spaces/underscores
        Object.keys(deal).forEach(key => {
          // First store with original key
          normalizedDeal[key] = deal[key];
          
          // Then store normalized version (remove spaces and trailing/leading spaces)
          const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
          if (normalizedKey !== key) {
            normalizedDeal[normalizedKey] = deal[key];
          }
        });
        
        // Get establishment_id from restaurant_id or establishment_id field
        const restaurantId = normalizedDeal.restaurant_id || normalizedDeal.establishment_id || '';
        
        console.log(`Deal for restaurant ID: "${restaurantId}"`);
        
        if (!restaurantId || !idMapping.has(restaurantId.toString())) {
          console.warn(`Skipping deal for unknown restaurant ID: ${restaurantId}`);
          continue;
        }
        
        const establishmentId = idMapping.get(restaurantId.toString())!;
        
        // Calculate standard and happy hour prices
        const standardPrice = parseFloat(normalizedDeal.regular_price || normalizedDeal.standard_price || '0');
        const happyHourPrice = parseFloat(normalizedDeal.happy_hour_price || '0');
        
        // Calculate savings and savings percentage
        const savings = standardPrice - happyHourPrice;
        const savingsPercentage = standardPrice > 0 ? Math.round((savings / standardPrice) * 100) : 0;
        
        // Fix time format to ensure HH:MM (24-hour) format
        function formatTimeCorrectly(timeStr: string | null | undefined): string {
          if (!timeStr) return '16:00'; // Default
          
          // Remove any spaces
          timeStr = timeStr.trim();
          
          // Handle case where time is just a single digit for hour ("9:00")
          if (timeStr.match(/^\d:\d\d$/)) {
            return `0${timeStr}`;
          }
          
          // Handle case where time has no leading zero for midnight ("0:00")
          if (timeStr === '0:00') {
            return '00:00';
          }
          
          return timeStr;
        }
        
        // Normalize valid days to lowercase
        const validDays = (normalizedDeal.valid_days || 'all days').toLowerCase();
                
        // Map and process fields
        const dealData = {
          establishmentId,
          alcohol_category: normalizedDeal.alcohol_category || 'Beer',
          alcohol_subcategory: normalizedDeal.alcohol_subcategory || null,
          alcohol_subcategory2: normalizedDeal.alcohol_subcategory2 || null,
          drink_name: normalizedDeal.drink_name || normalizedDeal.product_name || '',
          standard_price: standardPrice,
          happy_hour_price: happyHourPrice,
          savings: savings,
          savings_percentage: savingsPercentage,
          valid_days: validDays,
          hh_start_time: formatTimeCorrectly(normalizedDeal.hh_start_time),
          hh_end_time: formatTimeCorrectly(normalizedDeal.hh_end_time),
          description: normalizedDeal.description || '',
          collections: normalizedDeal.collections || '',
        };
        
        // Skip if missing essential data
        if (!dealData.drink_name || dealData.drink_name.trim() === '') {
          console.warn(`Skipping deal with missing name:`, normalizedDeal);
          continue;
        }
        
        // Skip if prices are invalid
        if (isNaN(dealData.standard_price!) || isNaN(dealData.happy_hour_price!)) {
          console.warn(`Skipping deal with invalid prices:`, normalizedDeal);
          continue;
        }
        
        // Fix type issue in the Drizzle ORM insertion
        const [inserted] = await db.insert(deals).values(dealData as any).returning();
        
        console.log(`Imported deal: ${inserted.drink_name} for ${restaurantId} (DB ID: ${establishmentId})`);
      } catch (error) {
        console.error(`Error importing deal row ${i}:`, error);
        console.error('Row data:', deal);
      }
    }
    
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error importing data from Google Sheets:', error);
  }
}

// Run the import
importDeals().then(() => {
  console.log('All done!');
}).catch(error => {
  console.error('Script failed:', error);
});