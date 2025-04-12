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
    
    // Try to find the appropriate sheet for deals in order of preference:
    // 1. A sheet named "Deals"
    // 2. A sheet named "Sheet2" (if it has headers)
    // 3. Sheet1 as fallback
    let dealsSheet = doc.sheetsByTitle['Deals'];
    
    if (!dealsSheet) {
      console.log('No sheet named "Deals" found, checking if Sheet2 is available...');
      try {
        const sheet2 = doc.sheetsByTitle['Sheet2']; 
        if (sheet2) {
          // We need to check if Sheet2 has headers, which we do by seeing if it throws an error
          try {
            // This will throw an error if there are no headers
            await sheet2.getRows({ limit: 1 });
            dealsSheet = sheet2;
            console.log('Using Sheet2 for deals data.');
          } catch (err) {
            console.log('Sheet2 exists but has no headers.');
          }
        }
      } catch (err) {
        console.log('Error checking Sheet2:', err);
      }
    }
    
    // Fall back to Sheet1 if no other sheet is usable
    if (!dealsSheet) {
      console.log('Falling back to Sheet1 for deals data.');
      dealsSheet = doc.sheetsByTitle['Sheet1'];
    }
    
    if (!dealsSheet) {
      console.log("No usable sheet found - returning empty array. You need to create a sheet with headers in your Google Sheets document.");
      return []; // Return empty array instead of throwing an error
    }
    
    // Log the sheet information to help with debugging
    console.log(`Using sheet: ${dealsSheet.title} with ${dealsSheet.rowCount} rows and ${dealsSheet.columnCount} columns`);
    
    // First, fetch all establishments to find matching external_ids
    const establishmentsMap = new Map();
    try {
      const establishmentsData = await db.select().from(establishments);
      for (const establishment of establishmentsData) {
        if (establishment.external_id) {
          establishmentsMap.set(establishment.external_id, establishment.id);
        }
      }
      console.log(`Loaded ${establishmentsMap.size} establishments for ID mapping`);
    } catch (error) {
      console.error("Error fetching establishments:", error);
    }
    
    // Load the rows from the sheet
    const rows = await dealsSheet.getRows();
    
    // Log the header row to see what columns we have
    if (rows.length > 0) {
      const firstRow = rows[0];
      console.log("Available columns:", firstRow.toObject());
    } else {
      console.log("No data rows found in the sheet.");
      return [];
    }
    
    // Map the data from the sheet to the deals structure
    // The field mapping is more flexible to handle variations in column naming
    return rows.map((row, index) => {
      // Convert the row to an object for easier access
      const rowData = row.toObject();
      console.log(`Row ${index + 1} data:`, rowData);
      
      // Try to get the establishment ID, checking multiple possible field names
      // First get the ID as a string
      const establishmentExternalId = 
        rowData.establishment_id || 
        rowData.establishmentId || 
        rowData.restaurantId ||
        '0';
      
      // Look up the actual database ID from the external ID
      let establishmentId = 0;
      if (establishmentsMap.has(establishmentExternalId)) {
        establishmentId = establishmentsMap.get(establishmentExternalId);
        console.log(`Mapped external ID ${establishmentExternalId} to database ID ${establishmentId}`);
      } else {
        console.log(`Warning: No matching establishment found for external ID ${establishmentExternalId}`);
      }
      
      // Alcohol categories - flexible field mapping
      const alcohol_category = 
        rowData.alcohol_category || 
        rowData.alcoholCategory || 
        rowData.category || 
        '';
        
      const alcohol_subcategory = 
        rowData.alcohol_subcategory || 
        rowData.alcoholSubcategory || 
        rowData.subcategory || 
        '';
        
      const alcohol_subcategory2 = 
        rowData.alcohol_subcategory2 || 
        rowData.alcoholSubcategory2 || 
        rowData.subcategory2 || 
        '';
        
      const drink_name = 
        rowData.drink_name || 
        rowData.drinkName || 
        rowData.name || 
        '';
      
      // Pricing - flexible field mapping
      const standard_price = parseFloat(
        rowData.standard_price || 
        rowData.standardPrice || 
        rowData.regularPrice || 
        rowData.price || 
        '0'
      );
      
      const happy_hour_price = parseFloat(
        rowData.happy_hour_price || 
        rowData.happyHourPrice || 
        rowData.dealPrice || 
        '0'
      );
      
      // Calculate savings
      const savings = standard_price - happy_hour_price;
      
      // Timing - flexible field mapping
      const valid_days = 
        rowData.valid_days || 
        rowData.validDays || 
        rowData.days || 
        '';
        
      const hh_start_time = 
        rowData.hh_start_time || 
        rowData.startTime || 
        rowData.hhStart || 
        '';
        
      const hh_end_time = 
        rowData.hh_end_time || 
        rowData.endTime || 
        rowData.hhEnd || 
        '';
      
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
        imageUrl: rowData.imageUrl || rowData.image || ''
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
      
      // Prepare start_time and end_time as timestamps for legacy fields
      const now = new Date();
      const [hhStartHour, hhStartMinute] = dealData.hh_start_time.split(':').map(Number);
      const [hhEndHour, hhEndMinute] = dealData.hh_end_time.split(':').map(Number);
      
      const start_time = new Date(now);
      start_time.setHours(hhStartHour || 0, hhStartMinute || 0, 0, 0);
      
      const end_time = new Date(now);
      end_time.setHours(hhEndHour || 0, hhEndMinute || 0, 0, 0);
      
      // Parse and structure days_of_week for legacy field
      const days_json = { 
        monday: dealData.valid_days.toLowerCase().includes('mon'), 
        tuesday: dealData.valid_days.toLowerCase().includes('tue'), 
        wednesday: dealData.valid_days.toLowerCase().includes('wed'), 
        thursday: dealData.valid_days.toLowerCase().includes('thu'), 
        friday: dealData.valid_days.toLowerCase().includes('fri'), 
        saturday: dealData.valid_days.toLowerCase().includes('sat'), 
        sunday: dealData.valid_days.toLowerCase().includes('sun'),
        all: dealData.valid_days.toLowerCase().includes('all')
      };
      
      // Prepare deal data for insertion with both legacy and new schema fields
      const dealToInsert = {
        // Legacy required fields
        title: dealData.drink_name || `${dealData.alcohol_category} Deal`,
        description: `${dealData.alcohol_category} ${dealData.alcohol_subcategory} - ${dealData.drink_name}`,
        status: 'active', // dealStatusEnum
        type: 'drink', // dealTypeEnum
        regular_price: dealData.standard_price,
        deal_price: dealData.happy_hour_price,
        savings_percentage: savings_percentage,
        start_time: start_time,
        end_time: end_time,
        days_of_week: days_json,
        
        // New schema fields
        establishmentId: dealData.establishmentId,
        alcohol_category: dealData.alcohol_category,
        alcohol_subcategory: dealData.alcohol_subcategory,
        alcohol_subcategory2: dealData.alcohol_subcategory2,
        drink_name: dealData.drink_name,
        standard_price: dealData.standard_price,
        happy_hour_price: dealData.happy_hour_price,
        savings: dealData.savings,
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