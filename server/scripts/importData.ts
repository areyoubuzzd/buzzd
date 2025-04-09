/**
 * Script to import data from Google Sheets to the database
 * 
 * Run this script using:
 * npx tsx server/scripts/importData.ts
 */

import { db } from '../db';
import { deals, establishments } from '../../shared/schema';
import { loadDeals, loadEstablishments, testGoogleSheetsConnection } from '../services/googleSheetsService';
import { eq } from 'drizzle-orm';

async function importEstablishments() {
  console.log('Importing establishments from Google Sheets...');
  
  try {
    // Load establishments from Google Sheets
    const establishmentsData = await loadEstablishments();
    console.log(`Loaded ${establishmentsData.length} establishments from Google Sheets`);
    
    // Insert establishments into database
    const result = await db.insert(establishments).values(establishmentsData);
    console.log(`Successfully inserted ${establishmentsData.length} establishments!`);
    
    return true;
  } catch (error) {
    console.error('Error importing establishments:', error);
    return false;
  }
}

async function importDeals() {
  console.log('Importing deals from Google Sheets...');
  
  try {
    // Load deals from Google Sheets
    const { deals: dealsData, establishmentMap } = await loadDeals();
    console.log(`Loaded ${dealsData.length} deals from Google Sheets`);
    
    // Deals are already filtered in the loadDeals function
    if (dealsData.length === 0) {
      console.error('No deals to import!');
      return false;
    }
    
    // Insert deals into database
    const result = await db.insert(deals).values(dealsData);
    console.log(`Successfully inserted ${dealsData.length} deals!`);
    
    return true;
  } catch (error) {
    console.error('Error importing deals:', error);
    return false;
  }
}

async function clearDatabase() {
  console.log('Clearing existing data...');
  
  try {
    // Delete all deals first (due to foreign key constraints)
    await db.delete(deals);
    console.log('All deals deleted');
    
    // Delete all establishments
    await db.delete(establishments);
    console.log('All establishments deleted');
    
    return true;
  } catch (error) {
    console.error('Error clearing database:', error);
    return false;
  }
}

async function main() {
  // Test Google Sheets connection first
  const isConnected = await testGoogleSheetsConnection();
  
  if (!isConnected) {
    console.error('Failed to connect to Google Sheets. Check your credentials and try again.');
    process.exit(1);
  }
  
  // Clear database before importing new data
  const isCleared = await clearDatabase();
  
  if (!isCleared) {
    console.error('Failed to clear database. Import aborted.');
    process.exit(1);
  }
  
  // Import establishments first
  const establishmentsImported = await importEstablishments();
  
  if (!establishmentsImported) {
    console.error('Failed to import establishments. Deals import aborted.');
    process.exit(1);
  }
  
  // Then import deals
  const dealsImported = await importDeals();
  
  if (!dealsImported) {
    console.error('Failed to import deals.');
    process.exit(1);
  }
  
  console.log('Data import completed successfully!');
  process.exit(0);
}

// Run the script
main();