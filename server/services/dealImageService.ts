import { db } from '../db';
import { eq, like, sql } from 'drizzle-orm';
import { deals } from '@shared/schema';

/**
 * Update deal images in the database by alcohol category
 * This will assign generated images to deals that don't have images
 */
export async function updateDealImagesByCategory(categoryToImageMap: Record<string, string>): Promise<{
  updatedDealIds: number[];
  totalUpdated: number;
}> {
  const updatedDealIds: number[] = [];
  
  try {
    // For each category in the map, update deals with that category that don't have an image
    for (const [category, imagePath] of Object.entries(categoryToImageMap)) {
      // Find deals with this category and no image
      const dealsToUpdate = await db
        .select({ id: deals.id })
        .from(deals)
        .where(
          sql`LOWER(${deals.alcohol_category}) LIKE ${`%${category.toLowerCase()}%`} AND 
              (${deals.imageUrl} IS NULL OR ${deals.imageUrl} = '')`
        );
      
      if (dealsToUpdate.length > 0) {
        // Get IDs of deals to update
        const dealIds = dealsToUpdate.map(deal => deal.id);
        
        // Update the deals with the new image path
        for (const id of dealIds) {
          await db
            .update(deals)
            .set({ imageUrl: imagePath })
            .where(eq(deals.id, id));
          
          updatedDealIds.push(id);
        }
        
        console.log(`Updated ${dealIds.length} deals in category '${category}' with image: ${imagePath}`);
      } else {
        console.log(`No deals found to update for category '${category}'`);
      }
    }
    
    return {
      updatedDealIds,
      totalUpdated: updatedDealIds.length
    };
  } catch (error) {
    console.error('Error updating deal images by category:', error);
    throw error;
  }
}

/**
 * Get deals without images
 */
export async function getDealsWithoutImages(limit = 50): Promise<{ id: number; category: string }[]> {
  try {
    const dealsWithoutImages = await db
      .select({
        id: deals.id,
        category: deals.alcohol_category
      })
      .from(deals)
      .where(
        sql`${deals.imageUrl} IS NULL OR ${deals.imageUrl} = ''`
      )
      .limit(limit);
    
    return dealsWithoutImages;
  } catch (error) {
    console.error('Error getting deals without images:', error);
    throw error;
  }
}