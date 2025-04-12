/**
 * Script to update the database schema directly using SQL commands
 * instead of using the interactive drizzle-kit push command
 */

import 'dotenv/config';
import { pool } from '../db';

const alterTableSql = `
-- Add new columns to the deals table for the simplified schema
ALTER TABLE IF EXISTS "deals" 
  ADD COLUMN IF NOT EXISTS "alcohol_category" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "alcohol_subcategory" TEXT,
  ADD COLUMN IF NOT EXISTS "alcohol_subcategory2" TEXT,
  ADD COLUMN IF NOT EXISTS "drink_name" TEXT,
  ADD COLUMN IF NOT EXISTS "standard_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "happy_hour_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "savings" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "savings_percentage" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "valid_days" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "hh_start_time" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "hh_end_time" TEXT NOT NULL DEFAULT '';
`;

async function updateSchema() {
  try {
    console.log("Updating database schema...");
    
    // Run the SQL queries to add new columns
    await pool.query(alterTableSql);
    
    console.log("Database schema updated successfully!");
    console.log("You can now import deals from Google Sheets using:");
    console.log("  npx tsx server/scripts/import-deals-direct.ts --import");
    
    process.exit(0);
  } catch (error) {
    console.error("Error updating database schema:", error);
    process.exit(1);
  }
}

updateSchema();