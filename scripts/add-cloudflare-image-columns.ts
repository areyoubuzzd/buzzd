/**
 * Script to add Cloudflare image ID columns to the deals and establishments tables
 * Run with: npx tsx scripts/add-cloudflare-image-columns.ts
 */

import { pool } from '../server/db';
import { sql } from 'drizzle-orm';

async function addImageIdColumns() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration to add Cloudflare image ID columns...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Check if the image_id column already exists in the deals table
    const checkDealsColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'deals' AND column_name = 'image_id'
    `);
    
    // Add image_id column to deals table if it doesn't exist
    if (checkDealsColumn.rowCount === 0) {
      console.log('Adding image_id column to deals table...');
      await client.query(`
        ALTER TABLE deals 
        ADD COLUMN image_id TEXT
      `);
      console.log('Successfully added image_id column to deals table');
    } else {
      console.log('image_id column already exists in deals table');
    }
    
    // Check if the image_id column already exists in the establishments table
    const checkEstablishmentsColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'establishments' AND column_name = 'image_id'
    `);
    
    // Add image_id column to establishments table if it doesn't exist
    if (checkEstablishmentsColumn.rowCount === 0) {
      console.log('Adding image_id column to establishments table...');
      await client.query(`
        ALTER TABLE establishments 
        ADD COLUMN image_id TEXT
      `);
      console.log('Successfully added image_id column to establishments table');
    } else {
      console.log('image_id column already exists in establishments table');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Database migration completed successfully!');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error during database migration:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Run the migration
addImageIdColumns()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });