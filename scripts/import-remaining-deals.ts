/**
 * Script to import the remaining deals data from Google Sheets
 * Focusing on establishments that don't have deals yet
 * 
 * Run with: npx tsx scripts/import-remaining-deals.ts
 */

import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { db } from '../server/db';
import { deals, establishments } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

// The spreadsheet ID and range
const SPREADSHEET_ID = '1mvmQLAe326ABsIfe2m1dZDd8StlrZrBKjujcT4nGpy0';
const RANGE = 'deals!A:P'; // This will read all columns from A to P in the "deals" sheet

async function getEstablishmentsWithoutDeals() {
  // First get all establishments
  const allEstablishments = await db.select().from(establishments);
  
  // Then get establishments that have deals
  const dealsQuery = await db.select({ 
    establishmentId: deals.establishmentId 
  })
  .from(deals)
  .groupBy(deals.establishmentId);
  
  const establishmentIdsWithDeals = new Set(dealsQuery.map(d => d.establishmentId));
  
  // Filter establishments that don't have deals
  const establishmentsWithoutDeals = allEstablishments.filter(
    est => !establishmentIdsWithDeals.has(est.id)
  );
  
  console.log(`Found ${establishmentsWithoutDeals.length} establishments without deals:`);
  establishmentsWithoutDeals.forEach(est => {
    console.log(`- ${est.name} (${est.external_id} → DB ID: ${est.id})`);
  });
  
  return establishmentsWithoutDeals;
}

async function importRemainingDeals() {
  console.log(`Starting targeted import for remaining deals from Google Sheets spreadsheet ID: ${SPREADSHEET_ID}`);
  
  try {
    // Get establishments without deals
    const establishmentsWithoutDeals = await getEstablishmentsWithoutDeals();
    
    // Create a set of external IDs we need to import
    const targetExternalIds = new Set(
      establishmentsWithoutDeals
        .map(est => est.external_id)
        .filter(id => id !== null && id !== undefined)
    );
    
    // Also create ID mapping for all establishments
    const existingEstablishments = await db.select().from(establishments);
    const idMapping = new Map<string, number>();
    
    // Create mapping from external_id to database id
    existingEstablishments.forEach(est => {
      if (est.external_id) {
        idMapping.set(est.external_id, est.id);
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
    
    // Fetch data from the spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
    
    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      throw new Error('No data found in spreadsheet');
    }
    
    console.log(`Found ${rows.length - 1} rows of data (excluding header)`);
    
    // Extract headers and data rows
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    // Focus on remaining establishments
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      try {
        // Convert row array to object using headers
        const deal: Record<string, string> = {};
        headers.forEach((header, index) => {
          deal[header] = row[index] || '';
        });
        
        // Create normalized object (convert to standard format)
        const normalizedDeal: Record<string, any> = {};
        
        // normalize column names (handle variations in naming)
        Object.keys(deal).forEach(key => {
          // Convert to snake_case, standardized key
          let normalizedKey = key.toLowerCase()
            .replace(/\s+/g, '_')      // Replace spaces with underscores
            .replace(/[^a-z0-9_]/g, '') // Remove any characters that aren't alphanumeric or underscore
            .trim();
            
          normalizedDeal[normalizedKey] = deal[key];
        });
        
        // Get establishment_id from restaurant_id or establishment_id field
        const restaurantId = normalizedDeal.restaurant_id || normalizedDeal.establishment_id || '';
        
        // Skip if not in our target list
        if (!targetExternalIds.has(restaurantId.toString())) {
          skippedCount++;
          continue;
        }
        
        console.log(`Processing deal for restaurant ID: "${restaurantId}"`);
        
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
          drink_name: normalizedDeal.drink_name || '',
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
        if (isNaN(dealData.standard_price) || isNaN(dealData.happy_hour_price)) {
          console.warn(`Skipping deal with invalid prices:`, normalizedDeal);
          continue;
        }
        
        // Insert into database
        const [inserted] = await db.insert(deals).values(dealData as any).returning();
        
        console.log(`Imported deal: ${inserted.drink_name} for ${restaurantId} (DB ID: ${establishmentId})`);
        successCount++;
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nImport summary:`);
    console.log(`- ${successCount} deals successfully imported`);
    console.log(`- ${errorCount} errors encountered`);
    console.log(`- ${skippedCount} deals skipped (already imported establishments)`);
  } catch (error) {
    console.error('Error importing remaining deals from Google Sheets:', error);
  }
}

// Run the import
importRemainingDeals().then(() => {
  console.log('All done!');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});