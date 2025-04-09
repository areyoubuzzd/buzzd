/**
 * This is a reference script to show how to insert deals into the database
 * Run this file with ts-node or build and run with node
 */

import { db } from "../server/db";
import { deals } from "../shared/schema";
import {
  houseWineDeals,
  beerDeals,
  spiritDeals,
  cocktailDeals,
  foodDeals,
  combinedDeals,
  calculateSavingsPercentage
} from "./example-deals";

/**
 * Helper function to insert deals
 */
async function insertDeals(establishmentId: number) {
  console.log("Inserting deals for establishment ID:", establishmentId);
  
  try {
    // Combine all deal examples
    const allDeals = [
      ...houseWineDeals,
      ...beerDeals,
      ...spiritDeals,
      ...cocktailDeals,
      ...foodDeals,
      ...combinedDeals
    ];
    
    // Add establishment ID and calculate savings percentage for each
    const dealsToInsert = allDeals.map(deal => ({
      ...deal,
      establishmentId,
      status: 'active',
      savingsPercentage: deal.isOneForOne ? 50 : calculateSavingsPercentage(deal.regularPrice!, deal.dealPrice!)
    }));
    
    // Insert deals into database
    const result = await db.insert(deals).values(dealsToInsert);
    
    console.log(`Successfully inserted ${dealsToInsert.length} deals!`);
    return result;
  } catch (error) {
    console.error("Error inserting deals:", error);
    throw error;
  }
}

/**
 * Example usage - replace with your actual establishment ID
 */
async function main() {
  // Replace 1 with your actual establishment ID
  const establishmentId = 1;
  
  try {
    await insertDeals(establishmentId);
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to insert deals:", error);
    process.exit(1);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  main();
}

export { insertDeals };