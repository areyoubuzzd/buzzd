/**
 * Script to create a "Deals" sheet in the Google Spreadsheet
 * with the correct headers for happy hour deals data
 */

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import 'dotenv/config';

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

// Define the headers for the deals sheet
const DEALS_HEADERS = [
  'establishment_id',
  'alcohol_category',
  'alcohol_subcategory',
  'alcohol_subcategory2',
  'drink_name',
  'standard_price',
  'happy_hour_price',
  'valid_days',
  'hh_start_time',
  'hh_end_time',
  'imageUrl'
];

// Define sample deal data for testing
const SAMPLE_DEALS = [
  {
    establishment_id: 'SG0109', // Chimichanga
    alcohol_category: 'Beer',
    alcohol_subcategory: 'Draft',
    alcohol_subcategory2: 'Lager',
    drink_name: 'Tiger Draft',
    standard_price: '15',
    happy_hour_price: '10',
    valid_days: 'Mon-Fri',
    hh_start_time: '17:00',
    hh_end_time: '20:00',
    imageUrl: ''
  },
  {
    establishment_id: 'SG0109', // Chimichanga
    alcohol_category: 'Cocktail',
    alcohol_subcategory: 'Margarita',
    alcohol_subcategory2: '',
    drink_name: 'Classic Margarita',
    standard_price: '22',
    happy_hour_price: '15',
    valid_days: 'Mon-Fri',
    hh_start_time: '17:00',
    hh_end_time: '20:00',
    imageUrl: ''
  },
  {
    establishment_id: 'SG0110', // The Pit
    alcohol_category: 'Wine',
    alcohol_subcategory: 'Red',
    alcohol_subcategory2: 'House Pour',
    drink_name: 'House Red Wine',
    standard_price: '18',
    happy_hour_price: '12',
    valid_days: 'All Week',
    hh_start_time: '16:00',
    hh_end_time: '19:00',
    imageUrl: ''
  }
];

async function createDealsSheet() {
  try {
    console.log(`Connecting to Google Spreadsheet ID: ${SPREADSHEET_ID}`);
    
    // Initialize the spreadsheet
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    
    // Load the document properties and sheets
    await doc.loadInfo();
    console.log(`Successfully connected to spreadsheet: "${doc.title}"`);
    
    // Check if Deals sheet already exists
    let dealsSheet = doc.sheetsByTitle['Deals'];
    
    if (dealsSheet) {
      console.log('A sheet named "Deals" already exists. Do you want to use it as is or reset it?');
      console.log('To reset it, run this script with --reset flag.');
      
      // Check if we should reset the sheet
      if (process.argv.includes('--reset')) {
        console.log('Resetting the Deals sheet...');
        await dealsSheet.clear();
        
        // Set the headers
        await dealsSheet.setHeaderRow(DEALS_HEADERS);
        console.log('Headers set successfully.');
        
        // Add sample data if requested
        if (process.argv.includes('--sample')) {
          console.log('Adding sample deal data...');
          await dealsSheet.addRows(SAMPLE_DEALS);
          console.log(`Added ${SAMPLE_DEALS.length} sample deals.`);
        }
        
        console.log('Deals sheet reset successfully!');
      } else {
        console.log('No changes made to the existing Deals sheet.');
      }
    } else {
      // Check if we should try to use Sheet2
      let sheet2 = doc.sheetsByTitle['Sheet2'];
      
      if (sheet2 && process.argv.includes('--use-sheet2')) {
        console.log('Renaming Sheet2 to Deals...');
        await sheet2.updateProperties({ title: 'Deals' });
        dealsSheet = sheet2;
        
        // Clear any existing data
        await dealsSheet.clear();
        
        // Set the headers
        await dealsSheet.setHeaderRow(DEALS_HEADERS);
        console.log('Headers set successfully.');
        
        // Add sample data if requested
        if (process.argv.includes('--sample')) {
          console.log('Adding sample deal data...');
          await dealsSheet.addRows(SAMPLE_DEALS);
          console.log(`Added ${SAMPLE_DEALS.length} sample deals.`);
        }
        
        console.log('Sheet2 renamed to Deals and configured successfully!');
      } else {
        // Create a new Deals sheet
        console.log('Creating a new sheet named "Deals"...');
        dealsSheet = await doc.addSheet({ title: 'Deals' });
        
        // Set the headers
        await dealsSheet.setHeaderRow(DEALS_HEADERS);
        console.log('Headers set successfully.');
        
        // Add sample data if requested
        if (process.argv.includes('--sample')) {
          console.log('Adding sample deal data...');
          await dealsSheet.addRows(SAMPLE_DEALS);
          console.log(`Added ${SAMPLE_DEALS.length} sample deals.`);
        }
        
        console.log('Deals sheet created successfully!');
      }
    }
    
    console.log('\nDone! Your Deals sheet is ready for use.');
    console.log('You can now run:');
    console.log('  npx tsx server/scripts/test-deals-import.ts');
    console.log('  - or -');
    console.log('  bash import-deals.sh');
    console.log('\nTo test getting data from this sheet.');
    
  } catch (error) {
    console.error('Error creating Deals sheet:', error);
    process.exit(1);
  }
}

// Run the script
createDealsSheet();