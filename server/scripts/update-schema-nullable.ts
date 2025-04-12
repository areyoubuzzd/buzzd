/**
 * Script to modify the deals table to make legacy fields nullable
 * This will simplify the import process for the new deal structure
 */

import 'dotenv/config';
import { pool } from '../db';

const alterTableSql = `
-- Make legacy fields nullable or provide defaults in the deals table
ALTER TABLE IF EXISTS "deals" 
  ALTER COLUMN "title" DROP NOT NULL,
  ALTER COLUMN "description" DROP NOT NULL,
  ALTER COLUMN "type" SET DEFAULT 'drink'::deal_type,
  ALTER COLUMN "regular_price" SET DEFAULT 0,
  ALTER COLUMN "deal_price" SET DEFAULT 0,
  ALTER COLUMN "savings_percentage" SET DEFAULT 0,
  ALTER COLUMN "start_time" SET DEFAULT now(),
  ALTER COLUMN "end_time" SET DEFAULT now(),
  ALTER COLUMN "days_of_week" SET DEFAULT '{"monday":false,"tuesday":false,"wednesday":false,"thursday":false,"friday":false,"saturday":false,"sunday":false}'::json;
`;

async function updateSchema() {
  try {
    console.log("Making legacy fields nullable or setting defaults...");
    
    // Run the SQL queries to modify column constraints
    await pool.query(alterTableSql);
    
    console.log("Schema updated successfully!");
    console.log("You can now import deals from Google Sheets using:");
    console.log("  npx tsx server/scripts/import-deals-direct.ts --import");
    
    process.exit(0);
  } catch (error) {
    console.error("Error updating schema:", error);
    process.exit(1);
  }
}

updateSchema();