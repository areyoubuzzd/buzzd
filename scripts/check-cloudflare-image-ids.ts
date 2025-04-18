/**
 * Script to check if Cloudflare image IDs in the database actually exist in Cloudflare Images
 * Run with: npx tsx scripts/check-cloudflare-image-ids.ts
 */

import { db } from '../server/db';
import { deals, establishments } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { getImageDetails } from '../server/services/cloudflare-images';

// Check if an image exists in Cloudflare Images
async function checkImageExists(imageId: string): Promise<boolean> {
  try {
    const result = await getImageDetails(imageId);
    return result.success === true;
  } catch (error) {
    console.error(`Error checking image ${imageId}:`, error);
    return false;
  }
}

async function checkDealImages() {
  try {
    // Get all deals with image IDs
    const dealsWithImages = await db
      .select({
        id: deals.id,
        drink_name: deals.drink_name,
        imageId: deals.imageId,
      })
      .from(deals)
      .where(
        // Make sure we don't try to check null or empty imageIds
        eq(deals.imageId != null, true)
      );
    
    console.log(`Found ${dealsWithImages.length} deals with image IDs to check.`);
    
    for (const deal of dealsWithImages) {
      if (!deal.imageId) continue;
      
      console.log(`Checking deal #${deal.id} (${deal.drink_name}) with image ID: ${deal.imageId}`);
      const exists = await checkImageExists(deal.imageId);
      
      console.log(`  ➤ Image ${exists ? 'EXISTS' : 'DOES NOT EXIST'} in Cloudflare`);
      
      // Output the expected URL
      if (!exists) {
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        console.log(`  ➤ Expected URL: https://imagedelivery.net/${accountId}/${deal.imageId}/public`);
      }
    }
  } catch (error) {
    console.error('Error checking deal images:', error);
  }
}

async function main() {
  try {
    console.log('Checking Cloudflare Images IDs...');
    await checkDealImages();
    console.log('Check completed.');
  } catch (error) {
    console.error('Error in check script:', error);
  }
}

main();