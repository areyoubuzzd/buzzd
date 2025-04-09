/**
 * Script to import restaurant data from Google Sheets to PostgreSQL
 */

import { google } from 'googleapis';
import pg from 'pg';

// Environment variables
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n');
const DATABASE_URL = process.env.DATABASE_URL;

// Set up Google Sheets API
const jwtClient = new google.auth.JWT(
  CLIENT_EMAIL,
  null,
  PRIVATE_KEY,
  ['https://www.googleapis.com/auth/spreadsheets.readonly']
);

const sheets = google.sheets({ version: 'v4', auth: jwtClient });

// Set up PostgreSQL connection
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function getRestaurantsFromSheet() {
  try {
    console.log('Authenticating with Google...');
    await jwtClient.authorize();
    console.log('Successfully authenticated!');
    
    // Get the spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    
    // Get the first sheet (assuming it's the restaurant sheet)
    const sheetTitle = spreadsheet.data.sheets[0].properties.title;
    console.log(`Reading data from sheet: ${sheetTitle}`);
    
    // Get the sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetTitle}!A1:L`,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in sheet.');
      return [];
    }
    
    // Extract headers and data
    const headers = rows[0];
    const data = rows.slice(1);
    
    console.log(`Found ${data.length} rows of data with ${headers.length} columns`);
    
    // Transform data to match our database schema
    const restaurants = data.map(row => {
      const restaurant = {};
      
      // Map the spreadsheet columns to our database columns
      row.forEach((value, index) => {
        const header = headers[index];
        
        // Skip empty values
        if (value === undefined || value === '') return;
        
        switch (header) {
          case 'restaurant name':
            restaurant.name = value;
            break;
          case 'full address':
            restaurant.address = value;
            break;
          case 'Area ':
            // Store area/neighborhood in description
            if (!restaurant.description) {
              restaurant.description = `Located in ${value}`;
            } else {
              restaurant.description += ` - Located in ${value}`;
            }
            break;
          case 'postalCode':
            restaurant.postal_code = value;
            break;
          case 'cuisine':
            restaurant.type = value || 'restaurant';
            break;
          case 'latitude':
            if (value && value.trim() !== '') {
              restaurant.latitude = parseFloat(value);
            }
            break;
          case 'longitude':
            if (value && value.trim() !== '') {
              restaurant.longitude = parseFloat(value);
            }
            break;
          case 'website ':
            // Include website in description
            if (!restaurant.description) {
              restaurant.description = `Website: ${value}`;
            } else {
              restaurant.description += ` | Website: ${value}`;
            }
            break;
          case 'logoUrl ':
            restaurant.image_url = value;
            break;
        }
      });
      
      // Set defaults for required fields
      if (!restaurant.name) return null; // Skip if no name
      
      restaurant.city = 'Singapore'; // Default city
      restaurant.rating = 4.0; // Default rating
      
      // Default values for coordinates (Orchard Road, Singapore)
      if (restaurant.latitude === undefined) {
        restaurant.latitude = 1.3036;
      }
      if (restaurant.longitude === undefined) {
        restaurant.longitude = 103.8318;
      }
      
      // Set default address if missing
      if (restaurant.address === undefined) {
        restaurant.address = restaurant.name + ", Singapore"; // Use restaurant name as part of address
      }
      
      // Set default postal code if missing (238839 is for Orchard Road)
      if (restaurant.postal_code === undefined) {
        restaurant.postal_code = "238839";
      }
      
      return restaurant;
    }).filter(Boolean); // Remove null values
    
    return restaurants;
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    throw error;
  }
}

async function importRestaurantsToDatabase(restaurants) {
  const client = await pool.connect();
  let importedCount = 0;
  
  try {
    await client.query('BEGIN');
    
    for (const restaurant of restaurants) {
      // Check if restaurant already exists (by name)
      const checkResult = await client.query(
        'SELECT id FROM establishments WHERE name = $1',
        [restaurant.name]
      );
      
      if (checkResult.rows.length > 0) {
        // Update existing restaurant
        const id = checkResult.rows[0].id;
        console.log(`Updating restaurant: ${restaurant.name} (ID: ${id})`);
        
        const updateResult = await client.query(
          `UPDATE establishments 
           SET description = $1, address = $2, city = $3, postal_code = $4, 
               latitude = $5, longitude = $6, image_url = $7, rating = $8, type = $9
           WHERE id = $10`,
          [
            restaurant.description,
            restaurant.address,
            restaurant.city,
            restaurant.postal_code,
            restaurant.latitude,
            restaurant.longitude,
            restaurant.image_url,
            restaurant.rating,
            restaurant.type,
            id
          ]
        );
      } else {
        // Insert new restaurant
        console.log(`Inserting new restaurant: ${restaurant.name}`);
        
        const insertResult = await client.query(
          `INSERT INTO establishments 
           (name, description, address, city, postal_code, latitude, longitude, image_url, rating, type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            restaurant.name,
            restaurant.description,
            restaurant.address,
            restaurant.city,
            restaurant.postal_code,
            restaurant.latitude,
            restaurant.longitude,
            restaurant.image_url,
            restaurant.rating,
            restaurant.type
          ]
        );
      }
      
      importedCount++;
    }
    
    await client.query('COMMIT');
    return importedCount;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing restaurants to database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main function
async function main() {
  try {
    console.log('Starting restaurant data import...');
    
    // Get restaurants from Google Sheets
    const restaurants = await getRestaurantsFromSheet();
    console.log(`Retrieved ${restaurants.length} restaurants from Google Sheets`);
    
    // Import restaurants to database
    const importedCount = await importRestaurantsToDatabase(restaurants);
    console.log(`Successfully imported ${importedCount} restaurants to database`);
    
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    // Close the pool
    pool.end();
  }
}

// Run the script
main();