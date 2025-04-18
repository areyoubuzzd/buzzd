/**
 * Script to add sample Cloudflare image IDs to the database for testing
 * Run with: npx tsx scripts/add-sample-cloudflare-ids.ts
 * 
 * This is for TESTING ONLY and should be removed before production
 */

import { db } from '../server/db';
import { deals, establishments } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { mapToDrinkCategory } from '../client/src/lib/drink-category-utils';

async function addSampleIds() {
  try {
    // Sample Cloudflare Image IDs - these are just placeholders, not real IDs
    // In a real migration, these would be actual IDs from Cloudflare Images
    const sampleDealImageIds = {
      'Tiger Pint': '71f8fefd-a48f-4b1d-651f-fe2bbff72300',
      'Heineken Pint': '8f08a33e-5ea3-43a1-95fc-9d4513a4f000',
      'Sapporo Pint': 'c07d8f2e-c9a1-4fb6-b707-01a0a675c100',
      'Glass of Red Wine': '237b2f83-77c7-4d53-a253-0459d9b73200',
      'Margarita': '3e9bde37-6c4d-448e-85fc-3be2fd4f8100',
      'Negroni': '508c82b8-5011-4fe7-af20-01ce95fca400',
      'Chivas 12': '6efaa9d0-ac8e-4f05-85c3-a5c0d4bdb900'
    };
    
    const sampleEstablishmentImageIds = {
      'Marmalade Pantry': 'a9c5e8d2-2187-492e-a1bc-6c6a6e8f4c00',
      'Barrels Balmoral': 'b42a7d3f-9e52-459d-b0a9-50f3b93dd300',
      'The Kongsee': 'f9783c4e-2bcd-4b94-b8c5-2de0f7a76700'
    };
    
    // Update deals with sample image IDs
    for (const [drinkName, imageId] of Object.entries(sampleDealImageIds)) {
      // Find deals with this drink name
      const matchingDeals = await db
        .select()
        .from(deals)
        .where(eq(deals.drink_name, drinkName));
      
      for (const deal of matchingDeals) {
        // Update with image ID
        await db
          .update(deals)
          .set({ 
            image_id: imageId,
            // Also, let's use our advanced categorization
            alcohol_subcategory: deal.alcohol_subcategory || getSubcategoryFromDrink(drinkName)
          })
          .where(eq(deals.id, deal.id));
        
        console.log(`Updated deal #${deal.id} (${drinkName}) with Cloudflare image ID: ${imageId}`);
      }
    }
    
    // Update establishments with sample image IDs
    for (const [establishmentName, imageId] of Object.entries(sampleEstablishmentImageIds)) {
      // Find establishments with this name
      const matchingEstablishments = await db
        .select()
        .from(establishments)
        .where(eq(establishments.name, establishmentName));
      
      for (const establishment of matchingEstablishments) {
        // Update with image ID
        await db
          .update(establishments)
          .set({ image_id: imageId })
          .where(eq(establishments.id, establishment.id));
        
        console.log(`Updated establishment #${establishment.id} (${establishmentName}) with Cloudflare image ID: ${imageId}`);
      }
    }
    
    console.log('Sample Cloudflare image IDs added successfully!');
  } catch (error) {
    console.error('Error adding sample Cloudflare image IDs:', error);
  }
}

// Helper function to determine subcategory from drink name
function getSubcategoryFromDrink(drinkName: string): string {
  const lowerName = drinkName.toLowerCase();
  
  if (lowerName.includes('tiger') || lowerName.includes('heineken') || lowerName.includes('sapporo')) {
    return 'Lager';
  }
  
  if (lowerName.includes('red wine')) {
    return 'Red Wine';
  }
  
  if (lowerName.includes('margarita')) {
    return 'Classic';
  }
  
  if (lowerName.includes('negroni')) {
    return 'Classic';
  }
  
  if (lowerName.includes('chivas')) {
    return 'Whisky';
  }
  
  return '';
}

// Run the function
addSampleIds();