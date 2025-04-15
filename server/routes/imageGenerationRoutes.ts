import { Router, Request, Response } from 'express';
import { db } from '../db';
import { deals } from '@shared/schema';
import { getDrinkImage, generateSampleImages } from '../services/openaiImageService';
import { eq, isNull, or } from 'drizzle-orm';

const router = Router();

/**
 * Generate a drink image for a specific deal
 * POST /api/image-generation/generate-for-deal/:dealId
 */
router.post("/generate-for-deal/:dealId", async (req: Request, res: Response) => {
  const { dealId } = req.params;
  const dealIdNum = parseInt(dealId, 10);

  if (isNaN(dealIdNum)) {
    return res.status(400).json({ error: "Invalid deal ID" });
  }

  try {
    // Get the deal
    const [dealToUpdate] = await db.select().from(deals).where(eq(deals.id, dealIdNum));
    
    if (!dealToUpdate) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // Generate image based on deal category and subcategory
    const category = dealToUpdate.alcohol_category;
    const subcategory = dealToUpdate.alcohol_subcategory || undefined;
    
    console.log(`Generating image for deal #${dealId}: ${category}/${subcategory || 'N/A'}`);
    
    // Generate the image
    const imageUrl = await getDrinkImage(category, subcategory);
    
    // Update the deal with the new image URL
    await db.update(deals)
      .set({ imageUrl })
      .where(eq(deals.id, dealIdNum));
    
    return res.status(200).json({ 
      success: true, 
      dealId: dealIdNum, 
      imageUrl,
      message: `Successfully generated and updated image for ${category}${subcategory ? '/' + subcategory : ''}`
    });
  } catch (error: any) {
    console.error("Error generating image for deal:", error);
    return res.status(500).json({ 
      error: `Failed to generate image for deal: ${error.message || 'Unknown error'}` 
    });
  }
});

/**
 * Generate a sample image for a specific drink category
 * POST /api/image-generation/generate-for-category/:category
 */
router.post("/generate-for-category/:category", async (req: Request, res: Response) => {
  const { category } = req.params;
  const { subcategory } = req.body;
  
  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }
  
  try {
    // Generate an image for this category/subcategory
    console.log(`Generating sample image for ${category}${subcategory ? '/' + subcategory : ''}`);
    
    const imageUrl = await getDrinkImage(category, subcategory);
    
    return res.status(200).json({
      success: true,
      category,
      subcategory,
      imageUrl,
      message: `Successfully generated sample image for ${category}${subcategory ? '/' + subcategory : ''}`
    });
  } catch (error: any) {
    console.error("Error generating sample image:", error);
    return res.status(500).json({ 
      error: `Failed to generate sample image: ${error.message || 'Unknown error'}` 
    });
  }
});

/**
 * Generate sample images for all categories
 * POST /api/image-generation/generate-samples
 */
router.post("/generate-samples", async (req: Request, res: Response) => {
  try {
    console.log("Generating sample images for all categories");
    
    const results = await generateSampleImages();
    
    return res.status(200).json({
      success: true,
      results,
      message: "Successfully generated sample images for all categories"
    });
  } catch (error: any) {
    console.error("Error generating sample images:", error);
    return res.status(500).json({ 
      error: `Failed to generate sample images: ${error.message || 'Unknown error'}` 
    });
  }
});

/**
 * Generate images for all deals that don't have an image
 * POST /api/image-generation/generate-missing
 */
router.post("/generate-missing", async (req: Request, res: Response) => {
  try {
    console.log("Generating images for deals with missing images");
    
    // Find deals with missing or empty images
    const dealsWithoutImages = await db
      .select()
      .from(deals)
      .where(or(
        eq(deals.imageUrl, ""),
        isNull(deals.imageUrl)
      ));
    
    console.log(`Found ${dealsWithoutImages.length} deals without images`);
    
    const results = [];
    
    // Generate and update images for each deal
    for (const deal of dealsWithoutImages) {
      try {
        const category = deal.alcohol_category;
        const subcategory = deal.alcohol_subcategory || undefined;
        
        console.log(`Generating image for deal #${deal.id}: ${category}/${subcategory || 'N/A'}`);
        
        // Generate the image
        const imageUrl = await getDrinkImage(category, subcategory);
        
        // Update the deal with the new image URL
        await db.update(deals)
          .set({ imageUrl })
          .where(eq(deals.id, deal.id));
        
        results.push({
          dealId: deal.id,
          category,
          subcategory,
          imageUrl,
          success: true
        });
      } catch (error: any) {
        console.error(`Error generating image for deal #${deal.id}:`, error);
        results.push({
          dealId: deal.id,
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      totalDeals: dealsWithoutImages.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      results,
      message: `Generated images for ${results.filter(r => r.success).length} out of ${dealsWithoutImages.length} deals`
    });
  } catch (error) {
    console.error("Error generating missing images:", error);
    return res.status(500).json({ 
      error: `Failed to generate missing images: ${error.message || 'Unknown error'}` 
    });
  }
});

export default router;