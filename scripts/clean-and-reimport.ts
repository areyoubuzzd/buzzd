/**
 * Script to clean the database and reimport all data from Google Sheets
 * Run with: npx tsx scripts/clean-and-reimport.ts
 */

import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';
import { createInterface } from 'readline';
import ws from 'ws';
import { syncAllDataFromSheets } from "../server/services/googleSheetsService";

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable not found!');
  process.exit(1);
}

// Configure the connection to use WebSockets for Neon serverless
const neonConfig = {
  webSocketConstructor: ws
};

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Confirm before proceeding
rl.question('⚠️ WARNING: This will DELETE ALL DATA from the database. Are you sure? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled. No changes made.');
    rl.close();
    return;
  }
  
  resetAndImport().then(() => {
    rl.close();
  }).catch(error => {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
  });
});

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

async function importData() {
  try {
    console.log('🔄 Importing data from Google Sheets...');
    
    // Use the existing function to import all data
    const result = await syncAllDataFromSheets();
    
    console.log(`✅ Import complete! Imported ${result.establishments} establishments and ${result.deals} deals.`);
    return true;
  } catch (error) {
    console.error('❌ Error importing data:', error);
    return false;
  }
}

async function resetAndImport() {
  console.log('🚀 Starting database reset and reimport process...');
  
  // Step 1: Clear the database
  const cleared = await clearDatabase();
  if (!cleared) {
    console.error('❌ Database reset failed. Aborting import.');
    return;
  }
  
  // Step 2: Import fresh data from Google Sheets
  const imported = await importData();
  if (!imported) {
    console.error('❌ Data import failed.');
    return;
  }
  
  console.log('✨ Database reset and reimport completed successfully!');
}