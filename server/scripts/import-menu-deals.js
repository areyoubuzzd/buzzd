/**
 * Import Menu Deals Script
 * 
 * This script uses the menu analysis to insert happy hour deals into the database
 * 
 * Usage:
 *   node import-menu-deals.js <path-to-image> <establishment-id>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Import the menu analysis function
import { analyzeMenu, formatDealsForDatabase } from './analyze-menu.js';

// Load environment variables
dotenv.config();

// Get dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for database connection
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is required");
  process.exit(1);
}

// Create database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Get establishment by ID or external_id
 */
async function getEstablishment(id) {
  const client = await pool.connect();
  
  try {
    let query, params;
    
    // Check if ID is numeric or a string (external_id)
    if (isNaN(id)) {
      // Treat as external_id
      query = 'SELECT id, name, external_id FROM establishments WHERE external_id = $1';
      params = [id];
    } else {
      // Treat as numeric ID
      query = 'SELECT id, name, external_id FROM establishments WHERE id = $1';
      params = [parseInt(id, 10)];
    }
    
    const result = await client.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error(`Establishment not found with ID: ${id}`);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error fetching establishment with ID ${id}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Insert deals into the database
 */
async function insertDeals(deals) {
  const client = await pool.connect();
  const results = { inserted: [], errors: [] };
  
  try {
    await client.query('BEGIN'); // Start transaction
    
    for (const deal of deals) {
      try {
        const query = `
          INSERT INTO deals (
            establishment_id, title, description, status, type, 
            drink_category, drink_subcategory, is_house_pour, brand, serving_style, serving_size,
            regular_price, deal_price, savings_percentage, is_one_for_one,
            start_time, end_time, days_of_week
          ) VALUES (
            $1, $2, $3, $4, $5, 
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15,
            $16, $17, $18
          ) RETURNING id`;
        
        const params = [
          deal.establishmentId,
          deal.title,
          deal.description,
          deal.status,
          deal.type,
          deal.drinkCategory,
          deal.drinkSubcategory,
          deal.isHousePour,
          deal.brand,
          deal.servingStyle,
          deal.servingSize,
          deal.regularPrice,
          deal.dealPrice,
          deal.savingsPercentage,
          deal.isOneForOne,
          deal.startTime,
          deal.endTime,
          JSON.stringify(deal.daysOfWeek)
        ];
        
        const result = await client.query(query, params);
        results.inserted.push({
          id: result.rows[0].id,
          title: deal.title
        });
      } catch (error) {
        results.errors.push({
          deal: deal.title,
          error: error.message
        });
      }
    }
    
    await client.query('COMMIT'); // Commit transaction
    return results;
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback if any error
    console.error("Error inserting deals:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * This script is designed to be used both as an importable module and as a standalone script
 * 
 * When imported, the exported functions can be used directly
 * When run from the command line, it will import the deals and display the results
 */

// Export a CLI handler function but don't run it automatically
export async function cliHandler() {
  try {
    // Check command line arguments
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error("Usage: node import-menu-deals.js <path-to-image> <establishment-id>");
      process.exit(1);
    }
    
    const imagePath = args[0];
    const establishmentId = args[1];
    
    // Validate image path
    if (!fs.existsSync(imagePath)) {
      console.error(`Error: Image file not found at ${imagePath}`);
      process.exit(1);
    }
    
    // Get establishment details
    console.log(`Looking up establishment with ID: ${establishmentId}`);
    const establishment = await getEstablishment(establishmentId);
    console.log(`Processing menu for: ${establishment.name} (ID: ${establishment.id}, External ID: ${establishment.external_id})`);
    
    // Analyze the menu
    console.log(`Analyzing menu: ${imagePath}`);
    const dealsData = await analyzeMenu(imagePath);
    
    // Format for database insertion
    const formattedDeals = formatDealsForDatabase(dealsData, establishment.id);
    
    if (formattedDeals.length === 0) {
      console.log("No valid deals found in the menu.");
      process.exit(0);
    }
    
    console.log(`Found ${formattedDeals.length} deals in the menu.`);
    
    // Ask for confirmation before inserting
    console.log("\nDeals to be inserted:");
    formattedDeals.forEach((deal, index) => {
      console.log(`${index + 1}. ${deal.title} - ${deal.dealPrice} (${deal.type}/${deal.drinkCategory || 'N/A'})`);
    });
    
    console.log("\nInserting deals into the database...");
    const results = await insertDeals(formattedDeals);
    
    // Show results
    console.log(`\nSuccessfully inserted ${results.inserted.length} deals:`);
    results.inserted.forEach(deal => {
      console.log(`- ${deal.title} (ID: ${deal.id})`);
    });
    
    if (results.errors.length > 0) {
      console.log(`\nFailed to insert ${results.errors.length} deals:`);
      results.errors.forEach(error => {
        console.log(`- ${error.deal}: ${error.error}`);
      });
    }
    
    console.log("\nDeal import complete!");
  } catch (error) {
    console.error("Error importing deals:", error);
    process.exit(1);
  } finally {
    pool.end();
  }
}

// This check will only run the CLI handler if this script is run directly (not imported)
if (process.argv[1] === import.meta.url.substring(7)) { // Remove 'file://' from URL
  cliHandler();
}