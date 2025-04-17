/**
 * Script to clear all data from database tables without dropping the tables
 * Run with: npx tsx scripts/clear-database-tables.ts
 */
import { db } from '../server/db';
import {
  deals,
  establishments,
  users,
  reviews,
  savedDeals,
  userDealViews,
  collections
} from '../shared/schema';
import { sql } from 'drizzle-orm';

async function clearDatabaseTables() {
  console.log('Starting database cleanup...');
  
  try {
    // Clear the tables in reverse order of dependencies
    console.log('Clearing user_deal_views table...');
    await db.delete(userDealViews);
    
    console.log('Clearing saved_deals table...');
    await db.delete(savedDeals);
    
    console.log('Clearing reviews table...');
    await db.delete(reviews);
    
    console.log('Clearing deals table...');
    await db.delete(deals);
    
    console.log('Clearing establishments table...');
    await db.delete(establishments);
    
    console.log('Clearing collections table if it exists...');
    try {
      await db.delete(collections);
    } catch (error) {
      console.log('No collections table found or error clearing it, continuing...');
    }
    
    console.log('Clearing users table...');
    await db.delete(users);
    
    // Reset sequence for all tables with auto-increment columns
    console.log('Resetting sequences...');
    await db.execute(sql`
      SELECT setval(pg_get_serial_sequence('"deals"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"establishments"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"users"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"reviews"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"saved_deals"', 'id'), 1, false);
      SELECT setval(pg_get_serial_sequence('"user_deal_views"', 'id'), 1, false);
    `);
    
    console.log('Database cleanup completed successfully! ✅');
  } catch (error) {
    console.error('Error during database cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
clearDatabaseTables().then(() => {
  console.log('Database is now empty and ready for fresh data import');
  process.exit(0);
}).catch(error => {
  console.error('Failed to clear database:', error);
  process.exit(1);
});