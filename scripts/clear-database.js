/**
 * Script to clear all tables in the database but keep the structure
 * Run with: node scripts/clear-database.js
 */

require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable not found!');
  process.exit(1);
}

// Configure the connection to use WebSockets for Neon serverless
const neonConfig = {};
neonConfig.webSocketConstructor = ws;

async function clearDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
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
  } catch (error) {
    // Rollback in case of error
    await pool.query('ROLLBACK');
    console.error('❌ Error clearing database:', error);
  } finally {
    await pool.end();
  }
}

clearDatabase().catch(console.error);