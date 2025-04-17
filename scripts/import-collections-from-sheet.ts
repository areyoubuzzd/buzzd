/**
 * Script to import collections data from Google Sheets
 * Run with: npx tsx scripts/import-collections-from-sheet.ts
 */

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { db } from '../server/db';
import { collections } from '../shared/schema';
import dotenv from 'dotenv';

dotenv.config();

// Configuration from environment variables
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.error('Missing required environment variables for Google Sheets API');
  process.exit(1);
}

async function importCollections() {
  try {
    console.log('Starting collections import from Google Sheets...');
    
    // Clear existing collections
    console.log('Clearing existing collections...');
    await db.delete(collections);
    
    // Setup authentication
    const serviceAccountAuth = new JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    // Setup document
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    console.log(`Loaded document: ${doc.title}`);
    
    // Get collections sheet - collections are in the first sheet named "collections"
    const sheet = doc.sheetsByTitle['collections'] || doc.sheetsByIndex[0];
    
    if (!sheet) {
      throw new Error('Collections sheet not found');
    }
    
    console.log(`Found sheet: ${sheet.title}`);
    
    // Load all rows
    const rows = await sheet.getRows();
    console.log(`Found ${rows.length} collections to import`);
    
    // Debug the column headers in the sheet
    const headerValues = rows[0]?._sheet.headerValues || [];
    console.log('Header values found in the sheet:', headerValues);
    
    // Debug the actual data in each row
    for (let i = 0; i < Math.min(rows.length, 3); i++) {
      console.log(`Row ${i+1} data:`, rows[i]._rawData);
      console.log(`Row ${i+1} slug:`, rows[i].get('slug'));
      console.log(`Row ${i+1} name:`, rows[i].get('name'));
      console.log(`Row ${i+1} priority:`, rows[i].get('priority'));
      console.log(`Row ${i+1} active:`, rows[i].get('active'));
    }
    
    // Process each row and build the collection objects
    const collectionsToInsert = rows.map(row => {
      const collection = {
        slug: (row.get('slug') || '').trim(),
        name: (row.get('name') || '').trim(),
        description: (row.get('description') || '').trim() || `${row.get('name')} collection`,
        priority: parseInt(row.get('priority') || '0', 10),
        icon: (row.get('icon') || 'star').trim(),
        active: (row.get('active') || 'false').toLowerCase() === 'true'
      };
      console.log('Processed collection:', collection);
      return collection;
    }).filter(collection => collection.slug && collection.name);
    
    console.log(`Prepared ${collectionsToInsert.length} valid collections for import`);
    
    // Insert collections in batches to avoid any potential issues
    const batchSize = 5;
    for (let i = 0; i < collectionsToInsert.length; i += batchSize) {
      const batch = collectionsToInsert.slice(i, i + batchSize);
      await db.insert(collections).values(batch);
      console.log(`Inserted collections ${i+1} to ${Math.min(i+batchSize, collectionsToInsert.length)}`);
    }
    
    // Verify the collections were inserted
    const insertedCollections = await db.select().from(collections);
    console.log(`Successfully inserted ${insertedCollections.length} collections:`);
    
    // Print summary of inserted collections
    insertedCollections.forEach(coll => {
      console.log(`- ${coll.slug}: "${coll.name}" (priority: ${coll.priority}, active: ${coll.active})`);
    });
    
    return insertedCollections;
  } catch (error) {
    console.error('Error importing collections:', error);
    throw error;
  }
}

// Run the import process
importCollections()
  .then(() => {
    console.log('Collections import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to import collections:', error);
    process.exit(1);
  });