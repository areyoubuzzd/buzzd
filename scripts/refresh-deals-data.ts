/**
 * Script to refresh deals data from Google Sheets
 * This script preserves all existing logic while updating deal information
 * 
 * Run with: npx tsx scripts/refresh-deals-data.ts
 */

import { db } from '../server/db';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { eq } from 'drizzle-orm';
import { deals } from '../shared/schema';
import * as dotenv from 'dotenv';

dotenv.config();

// Google Sheets credentials setup
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.error('Missing Google Sheets credentials. Check your environment variables.');
  process.exit(1);
}

/**
 * Load deal data from Google Sheets
 */
async function loadDealsData() {
  console.log('Authenticating with Google Sheets API...');
  const jwt = new JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, jwt);
  await doc.loadInfo();
  
  console.log(`Loaded document: ${doc.title}`);
  
  // Look for the deals tab with flexible naming
  const possibleTabNames = ['Deals', 'deals', 'Deal', 'deal', 'DEALS'];
  let sheet = null;
  
  // Try to find the deals sheet by possible names
  for (const tabName of possibleTabNames) {
    if (doc.sheetsByTitle[tabName]) {
      sheet = doc.sheetsByTitle[tabName];
      console.log(`Found sheet with name: ${tabName}`);
      break;
    }
  }
  
  // Fallback to sheet index if named tabs not found
  if (!sheet) {
    // Try a few sheet indexes (0 = first sheet, 1 = second sheet)
    for (let i = 0; i < 3; i++) {
      if (doc.sheetsByIndex[i]) {
        sheet = doc.sheetsByIndex[i];
        console.log(`Using sheet at index ${i}: ${sheet.title}`);
        break;
      }
    }
  }
  
  if (!sheet) {
    throw new Error('Could not find a sheet with deals data');
  }
  
  console.log(`Loading rows from sheet: ${sheet.title}`);
  const rows = await sheet.getRows();
  
  console.log(`Loaded ${rows.length} rows from Google Sheets`);
  return rows;
}

/**
 * Format time values for consistency
 */
function formatTimeCorrectly(timeStr: string | null | undefined): string {
  if (!timeStr) return '00:00';
  
  // Already in correct format like "17:00" or "17:00:00"
  if (timeStr.includes(':')) {
    return timeStr.split(':').slice(0, 2).join(':');
  }
  
  // Format like "1700" or "0900"
  if (timeStr.length === 4) {
    const hours = timeStr.substring(0, 2);
    const minutes = timeStr.substring(2, 4);
    return `${hours}:${minutes}`;
  }
  
  // Format like "900" (9:00)
  if (timeStr.length === 3) {
    const hour = timeStr.substring(0, 1);
    const minutes = timeStr.substring(1, 3);
    return `${hour}:${minutes}`;
  }
  
  // Just hours like "9" or "17"
  if (timeStr.length <= 2) {
    return `${timeStr}:00`;
  }
  
  return timeStr;
}

/**
 * Update deals in database with data from Google Sheets
 */
async function refreshDealsData() {
  try {
    console.log('Starting deals data refresh...');
    
    // Get existing deals from database for comparison
    const existingDeals = await db.select().from(deals);
    console.log(`Found ${existingDeals.length} existing deals in database`);
    
    // Create a mapping of deal IDs and establishment IDs for easy lookup
    const dealsMap = new Map();
    existingDeals.forEach(deal => {
      // Using drink_name and establishmentId as a unique key
      const key = `${deal.drink_name}-${deal.establishmentId}`;
      dealsMap.set(key, deal);
    });
    
    // Load deals from Google Sheets
    const sheetRows = await loadDealsData();
    
    // Counter for tracking changes
    let updatedDeals = 0;
    let skippedDeals = 0;
    let errors = 0;
    
    // Process each row from the sheet
    for (const row of sheetRows) {
      try {
        // Skip header or empty rows
        if (!row || !row.establishmentId || !row.drink_name) {
          skippedDeals++;
          continue;
        }
        
        const establishmentId = parseInt(row.establishmentId);
        if (isNaN(establishmentId)) {
          console.warn(`Skipping row with invalid establishmentId: ${row.establishmentId}`);
          skippedDeals++;
          continue;
        }
        
        // Create a key for this deal
        const dealKey = `${row.drink_name}-${establishmentId}`;
        const existingDeal = dealsMap.get(dealKey);
        
        // If the deal exists, update it
        if (existingDeal) {
          // Format times correctly
          const formattedStartTime = formatTimeCorrectly(row.hh_start_time);
          const formattedEndTime = formatTimeCorrectly(row.hh_end_time);
          
          // Prepare update data
          const updateData = {
            happy_hour_price: parseFloat(row.happy_hour_price) || existingDeal.happy_hour_price,
            standard_price: parseFloat(row.standard_price) || existingDeal.standard_price,
            valid_days: row.valid_days || existingDeal.valid_days,
            hh_start_time: formattedStartTime,
            hh_end_time: formattedEndTime,
            description: row.description || existingDeal.description,
            // Retain other data that shouldn't change
            alcohol_category: existingDeal.alcohol_category,
            alcohol_subcategory: existingDeal.alcohol_subcategory,
            alcohol_subcategory2: existingDeal.alcohol_subcategory2,
            drink_name: existingDeal.drink_name,
            collections: existingDeal.collections,
            // Don't change image-related fields
            imageUrl: existingDeal.imageUrl,
            imageId: existingDeal.imageId,
            // Calculate savings if needed
            savings: row.savings !== undefined ? parseFloat(row.savings) : 
              (existingDeal.standard_price - parseFloat(row.happy_hour_price)),
            savings_percentage: row.savings_percentage !== undefined ? parseFloat(row.savings_percentage) : 
              (((existingDeal.standard_price - parseFloat(row.happy_hour_price)) / existingDeal.standard_price) * 100),
          };
          
          // Only update if something has changed
          if (JSON.stringify(updateData) !== JSON.stringify(existingDeal)) {
            await db.update(deals)
              .set(updateData)
              .where(eq(deals.id, existingDeal.id));
            
            updatedDeals++;
            console.log(`Updated deal: ${row.drink_name} at establishment ${establishmentId}`);
          } else {
            skippedDeals++;
          }
        } else {
          // This is a new deal, but we're not adding new deals in this refresh script
          // We're only updating existing deals
          console.log(`Deal not found in database: ${row.drink_name} at establishment ${establishmentId}`);
          skippedDeals++;
        }
      } catch (error) {
        console.error(`Error processing row:`, error);
        errors++;
      }
    }
    
    console.log(`\nDeals refresh completed:`);
    console.log(`- Updated: ${updatedDeals}`);
    console.log(`- Skipped: ${skippedDeals}`);
    console.log(`- Errors: ${errors}`);
    
  } catch (error) {
    console.error('Error refreshing deals data:', error);
  }
}

// Run the refresh
refreshDealsData()
  .then(() => {
    console.log('Deals refresh process completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in refresh process:', error);
    process.exit(1);
  });