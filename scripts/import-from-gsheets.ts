/**
 * Script to import data from Google Sheets
 * Run with: npx tsx scripts/import-from-gsheets.ts <sheet_id> <tab_name>
 * 
 * Requires the following environment variables:
 * - GOOGLE_SHEETS_SPREADSHEET_ID: Google Sheets spreadsheet ID
 * - GOOGLE_SHEETS_CLIENT_EMAIL: Service account email
 * - GOOGLE_SHEETS_PRIVATE_KEY: Service account private key
 */
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { db } from '../server/db';
import {
  establishments,
  deals,
  type InsertEstablishment,
  type InsertDeal
} from '../shared/schema';
import { eq } from 'drizzle-orm';

// Check for required environment variables
if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
  console.error('GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required');
  process.exit(1);
}

if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
  console.error('GOOGLE_SHEETS_CLIENT_EMAIL environment variable is required');
  process.exit(1);
}

if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
  console.error('GOOGLE_SHEETS_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

// Get sheet ID from environment variable or command line
const SPREADSHEET_ID = process.argv[2] || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const TAB_NAME = process.argv[3] || 'restaurant'; // Default to 'restaurant' tab

/**
 * Connect to Google Sheets and load data
 */
async function loadSheetData(): Promise<any[]> {
  try {
    console.log(`Connecting to Google Sheets document ID: ${SPREADSHEET_ID}`);
    console.log(`Loading data from tab: ${TAB_NAME}`);
    
    // Initialize the sheet - using v4 API
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

    // Auth with service account
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY!.replace(/\\n/g, '\n'), // Fix escaped newlines
    });

    // Load spreadsheet info
    await doc.loadInfo();
    console.log(`Spreadsheet title: ${doc.title}`);

    // Get the specified sheet
    let sheet;
    // Try to get by title first
    if (doc.sheetsByTitle && doc.sheetsByTitle[TAB_NAME]) {
      sheet = doc.sheetsByTitle[TAB_NAME];
    } else if (doc.sheetsByIndex && doc.sheetsByIndex.length > 0) {
      // If not found by title, try to get the first sheet
      sheet = doc.sheetsByIndex[0];
      console.log(`Sheet "${TAB_NAME}" not found by title, using first sheet: "${sheet.title}"`);
    } else {
      console.error(`No sheets found in the spreadsheet`);
      process.exit(1);
    }

    // Load sheet rows
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    console.log(`Loaded ${rows.length} rows from "${sheet.title}" sheet`);
    console.log(`Headers: ${sheet.headerValues.join(', ')}`);

    // Convert to array of objects
    const data = rows.map(row => {
      const rowData: Record<string, any> = {};
      sheet.headerValues.forEach(header => {
        rowData[header] = row[header];
      });
      return rowData;
    });

    return data;
  } catch (error) {
    console.error('Error loading data from Google Sheets:', error);
    throw error;
  }
}

/**
 * Import establishments from the loaded data
 */
async function importEstablishments(data: any[]): Promise<Map<string, number>> {
  console.log('Importing establishments...');
  const idMapping = new Map<string, number>();
  
  for (const row of data) {
    try {
      // Map fields from Google Sheets to our schema
      const establishment: Partial<InsertEstablishment> = {
        external_id: row.restaurant_id?.toString() || null,
        name: row.restaurant_name || row['restaurant name'] || '',
        address: row.full_address || row['full address'] || '',
        city: row.area || '',
        postalCode: row.postalCode?.toString() || '',
        latitude: parseFloat(row.latitude) || 0,
        longitude: parseFloat(row.longitude) || 0,
        cuisine: row.cuisine || '',
        imageUrl: row.logoUrl || '',
        description: `${row.restaurant_name || row['restaurant name'] || ''} - Restaurant in Singapore`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Skip if missing essential data
      if (!establishment.name || establishment.name.trim() === '') {
        console.warn(`Skipping establishment with missing name:`, row);
        continue;
      }
      
      // Skip if missing latitude/longitude
      if (isNaN(establishment.latitude) || isNaN(establishment.longitude)) {
        console.warn(`Skipping establishment with invalid coordinates:`, establishment.name);
        continue;
      }
      
      // Insert into database
      const [insertedEstablishment] = await db
        .insert(establishments)
        .values(establishment as InsertEstablishment)
        .returning();
      
      // Map restaurant_id to database ID
      if (row.restaurant_id) {
        idMapping.set(row.restaurant_id.toString(), insertedEstablishment.id);
        console.log(`Imported establishment: ${insertedEstablishment.name} (${row.restaurant_id} → DB ID: ${insertedEstablishment.id})`);
      } else {
        console.log(`Imported establishment: ${insertedEstablishment.name} (DB ID: ${insertedEstablishment.id})`);
      }
    } catch (error) {
      console.error(`Error importing establishment:`, row, error);
    }
  }
  
  console.log(`Successfully imported ${idMapping.size} establishments`);
  return idMapping;
}

/**
 * Import deals from the loaded data
 */
async function importDeals(data: any[], idMapping: Map<string, number>): Promise<void> {
  console.log('Importing deals...');
  
  for (const row of data) {
    try {
      // Skip if no restaurant_id or it's not in our mapping
      if (!row.restaurant_id || !idMapping.has(row.restaurant_id.toString())) {
        console.warn(`Skipping deal with missing or unknown restaurant_id:`, row);
        continue;
      }
      
      const establishmentId = idMapping.get(row.restaurant_id.toString())!;
      
      // Map fields from Google Sheets to our schema
      const deal: Partial<InsertDeal> = {
        establishmentId,
        alcohol_category: row.alcohol_category || 'Beer',
        alcohol_subcategory: row.alcohol_subcategory || null,
        alcohol_subcategory2: row.alcohol_subcategory2 || null,
        drink_name: row.drink_name || row.product_name || '',
        standard_price: parseFloat(row.regular_price) || 0,
        happy_hour_price: parseFloat(row.happy_hour_price) || 0,
        savings: parseFloat(row.savings) || 0,
        savings_percentage: parseFloat(row.savings_percentage) || 0,
        valid_days: row.valid_days || 'All Days',
        hh_start_time: row.hh_start_time || '16:00',
        hh_end_time: row.hh_end_time || '19:00',
        collections: row.collections || '',
        description: row.description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Skip if missing essential data
      if (!deal.drink_name || deal.drink_name.trim() === '') {
        console.warn(`Skipping deal with missing name:`, row);
        continue;
      }
      
      // Calculate savings if not provided
      if (!deal.savings && deal.standard_price && deal.happy_hour_price) {
        deal.savings = deal.standard_price - deal.happy_hour_price;
      }
      
      // Calculate savings percentage if not provided
      if (!deal.savings_percentage && deal.standard_price && deal.happy_hour_price && deal.standard_price > 0) {
        deal.savings_percentage = Math.round((deal.standard_price - deal.happy_hour_price) / deal.standard_price * 100);
      }
      
      // Insert into database
      const [insertedDeal] = await db
        .insert(deals)
        .values(deal as InsertDeal)
        .returning();
      
      console.log(`Imported deal: ${insertedDeal.drink_name} for establishment ID ${establishmentId}`);
    } catch (error) {
      console.error(`Error importing deal:`, row, error);
    }
  }
}

/**
 * Main import function
 */
async function runImport() {
  try {
    // Load data from Google Sheets
    const data = await loadSheetData();
    
    if (TAB_NAME === 'restaurant') {
      // Import establishments
      const idMapping = await importEstablishments(data);
      console.log(`Establishments imported successfully! ✅`);
    } else if (TAB_NAME === 'deal' || TAB_NAME === 'deals') {
      // Get all establishments to create ID mapping
      const existingEstablishments = await db.select().from(establishments);
      const idMapping = new Map<string, number>();
      
      // Create mapping from external_id to database id
      existingEstablishments.forEach(est => {
        if (est.external_id) {
          idMapping.set(est.external_id, est.id);
        }
      });
      
      // Import deals
      await importDeals(data, idMapping);
      console.log(`Deals imported successfully! ✅`);
    } else {
      console.error(`Unknown tab type: ${TAB_NAME}`);
      process.exit(1);
    }
    
    console.log('Import completed successfully! ✅');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import
runImport().then(() => {
  console.log('Database has been populated with data from Google Sheets');
  process.exit(0);
}).catch(error => {
  console.error('Failed to import data:', error);
  process.exit(1);
});