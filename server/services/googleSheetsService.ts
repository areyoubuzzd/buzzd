import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { db } from '../db';
import { 
  deals,
  establishments,
  DrinkCategory, 
  WINE_TYPES, 
  SPIRIT_TYPES, 
  BEER_TYPES,
  calculateSavingsPercentage
} from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

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

/**
 * Get establishment data from Google Sheets
 */
export async function getEstablishmentsFromSheets(): Promise<any[]> {
  try {
    await doc.loadInfo();
    const establishmentsSheet = doc.sheetsByTitle['Restaurants Sheet'] || doc.sheetsByTitle['Sheet1'];
    
    if (!establishmentsSheet) {
      throw new Error("Restaurants sheet not found - please make sure you have a sheet named 'Restaurants Sheet' or 'Sheet1'");
    }
    
    const rows = await establishmentsSheet.getRows();
    
    // Adapt to your actual sheet structure - based on README.md schema for "Restaurants Sheet"
    return rows.map(row => {
      // Get all available fields, with defaults for required fields
      return {
        name: row.get('name') || row.get('restaurantName') || 'Unknown Restaurant',
        description: row.get('description') || '',
        address: row.get('address') || '',
        city: row.get('city') || 'Singapore',
        postalCode: row.get('postalCode') || '',
        latitude: parseFloat(row.get('latitude')) || 0,
        longitude: parseFloat(row.get('longitude')) || 0,
        imageUrl: row.get('logoUrl') || row.get('imageUrl') || null,
        rating: row.get('rating') ? parseFloat(row.get('rating')) : null,
        type: row.get('cuisine') || row.get('type') || 'restaurant'
      };
    });
  } catch (error) {
    console.error('Error getting establishments from Google Sheets:', error);
    throw error;
  }
}

/**
 * Get deals data from Google Sheets with simplified schema
 */
export async function getDealsFromSheets(): Promise<any[]> {
  try {
    await doc.loadInfo();
    // Try to find a sheet for deals - it might not exist yet
    const dealsSheet = doc.sheetsByTitle['Deals'] || doc.sheetsByTitle['Sheet1'];
    
    if (!dealsSheet) {
      console.log("Deals sheet not found - returning empty array. You need to create a 'Deals' sheet in your Google Sheets document.");
      return []; // Return empty array instead of throwing an error
    }
    
    const rows = await dealsSheet.getRows();
    
    return rows.map(row => {
      // Parse deal data from the sheet row with the new simplified structure
      const establishmentId = parseInt(row.get('establishment_id') || '0', 10);
      
      // Alcohol categories
      const alcohol_category = row.get('alcohol_category');
      const alcohol_subcategory = row.get('alcohol_subcategory');
      const alcohol_subcategory2 = row.get('alcohol_subcategory2');
      const drink_name = row.get('drink_name');
      
      // Pricing
      const standard_price = parseFloat(row.get('standard_price') || '0');
      const happy_hour_price = parseFloat(row.get('happy_hour_price') || '0');
      
      // Calculate savings
      const savings = standard_price - happy_hour_price;
      
      // Timing
      const valid_days = row.get('valid_days') || '';
      const hh_start_time = row.get('hh_start_time') || '';
      const hh_end_time = row.get('hh_end_time') || '';
      
      return {
        establishmentId,
        alcohol_category,
        alcohol_subcategory,
        alcohol_subcategory2,
        drink_name,
        standard_price,
        happy_hour_price,
        savings,
        valid_days,
        hh_start_time,
        hh_end_time,
        imageUrl: row.get('imageUrl')
      };
    });
  } catch (error) {
    console.error('Error getting deals from Google Sheets:', error);
    throw error;
  }
}

// This function is no longer needed with our simplified schema

/**
 * Sync establishments from Google Sheets to database
 */
export async function syncEstablishmentsFromSheets(): Promise<any[]> {
  try {
    const establishmentsData = await getEstablishmentsFromSheets();
    const results = [];
    
    for (const establishmentData of establishmentsData) {
      // Check if establishment already exists (by name)
      const existingEstablishment = await db.select().from(establishments)
        .where(eq(establishments.name, establishmentData.name));
      
      if (existingEstablishment.length > 0) {
        // Update existing establishment
        const result = await db.update(establishments)
          .set(establishmentData)
          .where(eq(establishments.name, establishmentData.name))
          .returning();
        
        results.push(result[0]);
      } else {
        // Insert new establishment
        const result = await db.insert(establishments)
          .values(establishmentData)
          .returning();
        
        results.push(result[0]);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error syncing establishments from Google Sheets:', error);
    throw error;
  }
}

/**
 * Sync deals from Google Sheets to database using simplified schema
 */
export async function syncDealsFromSheets(): Promise<any[]> {
  try {
    const dealsData = await getDealsFromSheets();
    const results = [];
    
    for (const dealData of dealsData) {
      // Calculate savings percentage
      const savings_percentage = calculateSavingsPercentage(dealData.standard_price, dealData.happy_hour_price);
      
      // Prepare deal data for insertion with new schema
      const dealToInsert = {
        establishmentId: dealData.establishmentId,
        alcohol_category: dealData.alcohol_category,
        alcohol_subcategory: dealData.alcohol_subcategory,
        alcohol_subcategory2: dealData.alcohol_subcategory2,
        drink_name: dealData.drink_name,
        standard_price: dealData.standard_price,
        happy_hour_price: dealData.happy_hour_price,
        savings: dealData.savings,
        savings_percentage,
        valid_days: dealData.valid_days,
        hh_start_time: dealData.hh_start_time,
        hh_end_time: dealData.hh_end_time,
        imageUrl: dealData.imageUrl
      };
      
      // Check if the deal already exists (by drink_name and establishment)
      const existingDeals = await db.select().from(deals)
        .where(
          and(
            eq(deals.drink_name, dealData.drink_name || ''),
            eq(deals.establishmentId, dealData.establishmentId)
          )
        );
      
      if (existingDeals.length > 0) {
        // Update existing deal
        const result = await db.update(deals)
          .set(dealToInsert)
          .where(eq(deals.id, existingDeals[0].id))
          .returning();
        
        results.push(result[0]);
        console.log(`Updated deal: ${dealData.drink_name} at establishment #${dealData.establishmentId}`);
      } else {
        // Insert new deal
        const result = await db.insert(deals)
          .values(dealToInsert)
          .returning();
        
        results.push(result[0]);
        console.log(`Inserted new deal: ${dealData.drink_name} at establishment #${dealData.establishmentId}`);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error syncing deals from Google Sheets:', error);
    throw error;
  }
}

/**
 * Sync both establishments and deals from Google Sheets to database
 */
export async function syncAllDataFromSheets() {
  try {
    console.log('Starting full database sync from Google Sheets...');
    
    console.log('Syncing establishments...');
    const establishments = await syncEstablishmentsFromSheets();
    console.log(`Synced ${establishments.length} establishments`);
    
    console.log('Syncing deals...');
    const dealsResult = await syncDealsFromSheets();
    console.log(`Synced ${dealsResult.length} deals`);
    
    return {
      establishments: establishments.length,
      deals: dealsResult.length
    };
  } catch (error) {
    console.error('Error during full sync:', error);
    throw error;
  }
}