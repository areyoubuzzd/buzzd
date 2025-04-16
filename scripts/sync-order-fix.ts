/**
 * Script to fix the sync order issue
 * Run with: npx tsx scripts/sync-order-fix.ts
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import 'dotenv/config';
import ws from 'ws';

// Configure connection and auth
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable not found!');
  process.exit(1);
}

// Environment variables for Google Sheets API
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  throw new Error('Missing Google Sheets credentials in environment variables');
}

// Configure WebSockets for Neon
neonConfig.webSocketConstructor = ws;

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

async function clearDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  
  try {
    // Start transaction
    await pool.query('BEGIN');
    
    console.log('🗑️  Clearing database tables...');
    
    // Clear all tables in the correct order based on foreign key dependencies
    console.log('Clearing user_deal_views table...');
    await pool.query('DELETE FROM user_deal_views');
    
    console.log('Clearing saved_deals table...');
    await pool.query('DELETE FROM saved_deals');
    
    console.log('Clearing reviews table...');
    await pool.query('DELETE FROM reviews');
    
    console.log('Clearing deals table...');
    await pool.query('DELETE FROM deals');
    
    console.log('Clearing establishments table...');
    await pool.query('DELETE FROM establishments');
    
    console.log('Clearing users table...');
    await pool.query('DELETE FROM users');
    
    // Reset sequences for id columns
    console.log('Resetting sequences...');
    await pool.query('ALTER SEQUENCE deals_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE establishments_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE reviews_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE saved_deals_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE user_deal_views_id_seq RESTART WITH 1');
    
    // Commit transaction
    await pool.query('COMMIT');
    
    console.log('✅ Database cleared successfully!');
    return true;
  } catch (error) {
    // Rollback in case of error
    await pool.query('ROLLBACK');
    console.error('❌ Error clearing database:', error);
    return false;
  } finally {
    await pool.end();
  }
}

async function importEstablishments() {
  try {
    console.log('Importing establishments from sheets...');
    await doc.loadInfo();
    const establishmentsSheet = doc.sheetsByTitle['Restaurants'] || doc.sheetsByTitle['Sheet1'];
    
    if (!establishmentsSheet) {
      throw new Error("Restaurants sheet not found - please make sure you have a sheet named 'Restaurants' or 'Sheet1'");
    }
    
    const rows = await establishmentsSheet.getRows();
    
    // Create establishments in database
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const results = [];
    
    for (const row of rows) {
      const establishment = {
        name: row.get('name') || row.get('restaurantName') || 'Unknown Restaurant',
        description: row.get('description') || 'Restaurant in Singapore',
        address: row.get('address') || '',
        city: row.get('city') || 'Singapore',
        postalCode: row.get('postalCode') || row.get('postal_code') || '',
        
        // Geolocation
        latitude: parseFloat(row.get('latitude')) || 0,
        longitude: parseFloat(row.get('longitude')) || 0,
        
        // Media and categorization
        imageUrl: row.get('logoUrl') || row.get('imageUrl') || row.get('image_url') || null,
        rating: row.get('rating') ? parseFloat(row.get('rating')) : null,
        
        cuisine: row.get('cuisine') || row.get('type') || 'Restaurant & Bar',
        
        // Important: external_id for reference
        external_id: row.get('external_id') || row.get('id') || null
      };
      
      try {
        // Insert the establishment
        const result = await pool.query(
          `INSERT INTO establishments (name, description, address, city, postal_code, 
           latitude, longitude, image_url, rating, cuisine, external_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [
            establishment.name,
            establishment.description,
            establishment.address,
            establishment.city,
            establishment.postalCode,
            establishment.latitude,
            establishment.longitude,
            establishment.imageUrl,
            establishment.rating,
            establishment.cuisine,
            establishment.external_id
          ]
        );
        
        console.log(`Created establishment: ${establishment.name} with external_id ${establishment.external_id}`);
        results.push(result.rows[0]);
      } catch (err: any) {
        console.error(`Error inserting establishment ${establishment.name}:`, err);
      }
    }
    
    await pool.end();
    console.log(`Imported ${results.length} establishments.`);
    return results;
  } catch (error) {
    console.error('Error importing establishments:', error);
    throw error;
  }
}

async function importDeals() {
  try {
    console.log('Importing deals from sheets...');
    await doc.loadInfo();
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
      console.log("No usable sheet found for deals.");
      return [];
    }
    
    // Log the sheet information to help with debugging
    console.log(`Using sheet: ${dealsSheet.title} with ${dealsSheet.rowCount} rows and ${dealsSheet.columnCount} columns`);
    
    // First, get the establishments to find matching external_ids
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const establishmentsResult = await pool.query('SELECT id, external_id FROM establishments');
    const establishmentsMap = new Map();
    
    for (const establishment of establishmentsResult.rows) {
      if (establishment.external_id) {
        establishmentsMap.set(establishment.external_id, establishment.id);
      }
    }
    
    console.log(`Loaded ${establishmentsMap.size} establishments for ID mapping: ${JSON.stringify(Object.fromEntries(establishmentsMap))}`);
    
    // Load the rows from the sheet
    const rows = await dealsSheet.getRows();
    const results = [];
    
    // Log the header row to see what columns we have
    if (rows.length > 0) {
      const firstRow = rows[0];
      console.log("Available columns:", firstRow.toObject());
    } else {
      console.log("No data rows found in the sheet.");
      await pool.end();
      return [];
    }
    
    for (const row of rows) {
      // Convert the row to an object for easier access
      const rowData = row.toObject();
      
      // Get the establishment ID from external ID
      const establishmentExternalId = 
        rowData.establishment_id || 
        rowData.establishmentId || 
        rowData.restaurantId ||
        '0';
        
      let establishmentId = 0;
      if (establishmentsMap.has(establishmentExternalId)) {
        establishmentId = establishmentsMap.get(establishmentExternalId);
        console.log(`Mapped external ID ${establishmentExternalId} to database ID ${establishmentId}`);
      } else {
        console.log(`Warning: No matching establishment found for external ID ${establishmentExternalId}`);
        // Skip this deal if no establishment found
        continue;
      }
      
      // Get deal data
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
      
      // Pricing
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
      const savings_percentage = standard_price > 0 
        ? Math.round((savings / standard_price) * 100)
        : 0;
      
      // Timing
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
      
      // Collections/tags
      const collections = 
        rowData.collections || 
        rowData.Collections || 
        rowData.tags || 
        rowData.Tags || 
        '';
        
      // Description
      const description = rowData.Description || rowData.description || '';
      
      // Is one-for-one?
      const is_one_for_one = 
        (rowData.is_one_for_one || rowData.isOneForOne || '').toLowerCase() === 'true' ||
        (collections || '').toLowerCase().includes('one_for_one') ||
        (collections || '').toLowerCase().includes('1-for-1');
      
      // Is house pour?
      const is_house_pour = 
        (rowData.is_house_pour || rowData.isHousePour || '').toLowerCase() === 'true' ||
        (alcohol_subcategory || '').toLowerCase().includes('house') ||
        (alcohol_subcategory2 || '').toLowerCase().includes('house');
      
      try {
        // Parse days for JSON
        const days_json = { 
          monday: valid_days.toLowerCase().includes('mon'), 
          tuesday: valid_days.toLowerCase().includes('tue'), 
          wednesday: valid_days.toLowerCase().includes('wed'), 
          thursday: valid_days.toLowerCase().includes('thu'), 
          friday: valid_days.toLowerCase().includes('fri'), 
          saturday: valid_days.toLowerCase().includes('sat'), 
          sunday: valid_days.toLowerCase().includes('sun'),
          all: valid_days.toLowerCase().includes('all')
        };
        
        // Insert the deal
        const result = await pool.query(
          `INSERT INTO deals (
             establishment_id, title, description, status, type, 
             regular_price, deal_price, savings_percentage, days_of_week,
             alcohol_category, alcohol_subcategory, alcohol_subcategory2, drink_name,
             standard_price, happy_hour_price, savings, valid_days, 
             hh_start_time, hh_end_time, collections, is_one_for_one, is_house_pour
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING *`,
          [
            establishmentId,
            drink_name || `${alcohol_category} Deal`,
            description || `${alcohol_category} ${alcohol_subcategory} - ${drink_name}`,
            'active',
            'drink',
            standard_price,
            happy_hour_price,
            savings_percentage,
            days_json,
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
            collections,
            is_one_for_one,
            is_house_pour
          ]
        );
        
        console.log(`Created deal: ${drink_name} for establishment #${establishmentId}`);
        results.push(result.rows[0]);
      } catch (err: any) {
        console.error(`Error inserting deal ${drink_name}:`, err);
      }
    }
    
    await pool.end();
    console.log(`Imported ${results.length} deals.`);
    return results;
  } catch (error) {
    console.error('Error importing deals:', error);
    throw error;
  }
}

async function syncAll() {
  try {
    console.log('🚀 Starting database reset and reimport process...');
    
    // Step 1: Clear the database
    const cleared = await clearDatabase();
    if (!cleared) {
      console.error('❌ Database reset failed. Aborting import.');
      return;
    }
    
    // Step 2: Import establishments
    console.log('Importing establishments...');
    const establishments = await importEstablishments();
    console.log(`✅ Imported ${establishments.length} establishments`);
    
    // Step 3: Import deals
    console.log('Importing deals...');
    const deals = await importDeals();
    console.log(`✅ Imported ${deals.length} deals`);
    
    console.log('✨ Database reset and reimport completed successfully!');
  } catch (error) {
    console.error('Error during sync:', error);
  }
}

// Run the script
syncAll();