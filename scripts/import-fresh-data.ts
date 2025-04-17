/**
 * Script to import fresh data from external sources
 * Run with: npx tsx scripts/import-fresh-data.ts
 * 
 * USAGE:
 * - First parameter: URL or path to establishments data JSON
 * - Second parameter: URL or path to deals data JSON
 * 
 * Example: npx tsx scripts/import-fresh-data.ts https://example.com/establishments.json https://example.com/deals.json
 */
import { db } from '../server/db';
import {
  establishments,
  deals,
  insertEstablishmentSchema,
  insertDealSchema,
  type Establishment,
  type Deal,
  type InsertEstablishment,
  type InsertDeal
} from '../shared/schema';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { parseArgs } from 'node:util';

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: npx tsx scripts/import-fresh-data.ts <establishments_url_or_path> <deals_url_or_path>');
  process.exit(1);
}

const establishmentsSource = args[0];
const dealsSource = args[1];

/**
 * Check if a string is a URL
 */
function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Load data from a URL or local file
 */
async function loadData(source: string): Promise<any> {
  try {
    if (isUrl(source)) {
      // Load from URL
      console.log(`Fetching data from URL: ${source}`);
      const response = await axios.get(source);
      return response.data;
    } else {
      // Load from local file
      const filePath = path.resolve(source);
      console.log(`Reading data from file: ${filePath}`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error(`Error loading data from ${source}:`, error);
    throw error;
  }
}

/**
 * Import establishments and create a mapping of external IDs to database IDs
 */
async function importEstablishments(data: any): Promise<Map<string, number>> {
  console.log('Importing establishments...');
  const externalIdToDbId = new Map<string, number>();
  
  // Ensure data is in the expected format
  const establishmentsArray = Array.isArray(data) ? data : 
                            (data.establishments ? data.establishments : 
                            (data.data ? data.data : []));
  
  if (establishmentsArray.length === 0) {
    console.error('No establishments found in the source data');
    process.exit(1);
  }
  
  console.log(`Found ${establishmentsArray.length} establishments to import`);
  
  // Process each establishment
  for (const establishment of establishmentsArray) {
    try {
      // Parse using zod schema to ensure data integrity
      const validatedEstablishment = insertEstablishmentSchema.parse({
        ...establishment,
        // Ensure these fields are set if they're missing
        createdAt: establishment.createdAt || new Date(),
        updatedAt: establishment.updatedAt || new Date()
      });
      
      // Store the external ID for mapping
      const externalId = establishment.external_id;
      
      // Insert into database
      const [insertedEstablishment] = await db
        .insert(establishments)
        .values(validatedEstablishment)
        .returning();
      
      // Map external ID to database ID
      if (externalId) {
        externalIdToDbId.set(externalId, insertedEstablishment.id);
        console.log(`Imported establishment: ${insertedEstablishment.name} (${externalId} → DB ID: ${insertedEstablishment.id})`);
      } else {
        console.log(`Imported establishment: ${insertedEstablishment.name} (DB ID: ${insertedEstablishment.id})`);
      }
    } catch (error) {
      console.error(`Error importing establishment:`, establishment, error);
    }
  }
  
  console.log(`Successfully imported ${externalIdToDbId.size} establishments`);
  return externalIdToDbId;
}

/**
 * Import deals using the mapping from external establishment IDs to database IDs
 */
async function importDeals(data: any, establishmentMapping: Map<string, number>): Promise<void> {
  console.log('Importing deals...');
  
  // Ensure data is in the expected format
  const dealsArray = Array.isArray(data) ? data : 
                   (data.deals ? data.deals : 
                   (data.data ? data.data : []));
  
  if (dealsArray.length === 0) {
    console.error('No deals found in the source data');
    process.exit(1);
  }
  
  console.log(`Found ${dealsArray.length} deals to import`);
  
  // Process each deal
  for (const deal of dealsArray) {
    try {
      // Get the establishment ID from the mapping
      let establishmentId: number;
      
      if (deal.establishmentId) {
        // Direct database ID reference
        establishmentId = deal.establishmentId;
      } else if (deal.establishment_id) {
        // Direct database ID reference (alternative naming)
        establishmentId = deal.establishment_id;
      } else if (deal.external_establishment_id && establishmentMapping.has(deal.external_establishment_id)) {
        // Mapped from external ID
        establishmentId = establishmentMapping.get(deal.external_establishment_id)!;
      } else if (deal.establishment_external_id && establishmentMapping.has(deal.establishment_external_id)) {
        // Mapped from external ID (alternative naming)
        establishmentId = establishmentMapping.get(deal.establishment_external_id)!;
      } else {
        console.error(`Cannot find establishment ID for deal:`, deal);
        continue;
      }
      
      // Parse using zod schema to ensure data integrity
      const validatedDeal = insertDealSchema.parse({
        ...deal,
        establishmentId,
        // Calculate savings if not provided but we have the prices
        savings: deal.savings || (
          deal.standard_price && deal.happy_hour_price ? 
          deal.standard_price - deal.happy_hour_price : 0
        ),
        // Calculate savings percentage if not provided but we have the prices
        savings_percentage: deal.savings_percentage || (
          deal.standard_price && deal.happy_hour_price && deal.standard_price > 0 ? 
          Math.round((deal.standard_price - deal.happy_hour_price) / deal.standard_price * 100) : 0
        ),
        // Ensure these fields are set if they're missing
        createdAt: deal.createdAt || new Date(),
        updatedAt: deal.updatedAt || new Date()
      });
      
      // Insert into database
      const [insertedDeal] = await db
        .insert(deals)
        .values(validatedDeal)
        .returning();
      
      console.log(`Imported deal: ${insertedDeal.drink_name} (${insertedDeal.alcohol_category}) for establishment ID ${establishmentId}`);
    } catch (error) {
      console.error(`Error importing deal:`, deal, error);
    }
  }
}

/**
 * Main function to run the import process
 */
async function runImport() {
  try {
    // Load establishments data
    const establishmentsData = await loadData(establishmentsSource);
    
    // Import establishments and get mapping
    const establishmentMapping = await importEstablishments(establishmentsData);
    
    // Load deals data
    const dealsData = await loadData(dealsSource);
    
    // Import deals using the mapping
    await importDeals(dealsData, establishmentMapping);
    
    console.log('Import completed successfully! ✅');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import
runImport().then(() => {
  console.log('Database has been populated with fresh data');
  process.exit(0);
}).catch(error => {
  console.error('Failed to import data:', error);
  process.exit(1);
});