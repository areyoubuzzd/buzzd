import { Router, Request, Response } from "express";
import { getDrinkImage, generateSampleImages } from "../services/openaiImageService";
import { db } from "../db";
import { deals } from "@shared/schema";
import { eq } from "drizzle-orm";
import { log } from "../vite";

const router = Router();

// Generate image for a specific deal
router.post("/generate-for-deal/:dealId", async (req: Request, res: Response) => {
  try {
    const dealId = parseInt(req.params.dealId);
    if (isNaN(dealId)) {
      return res.status(400).json({ error: "Invalid deal ID" });
    }

    // Get the deal
    const [deal] = await db.select().from(deals).where(eq(deals.id, dealId));
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // Generate the image
    const imageUrl = await getDrinkImage(
      deal.alcohol_category,
      deal.alcohol_subcategory || undefined,
      true // Force generation
    );

    // Update the deal with the new image URL
    const [updatedDeal] = await db
      .update(deals)
      .set({ imageUrl })
      .where(eq(deals.id, dealId))
      .returning();

    res.json({ 
      success: true, 
      message: "Image generated and associated with deal",
      imageUrl,
      deal: updatedDeal
    });
  } catch (error) {
    log(`Error generating image for deal: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Generate images for all deals in a category
router.post("/generate-for-category/:category", async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    // Get all deals in the category
    const dealsInCategory = await db
      .select()
      .from(deals)
      .where(eq(deals.alcohol_category, category));

    if (dealsInCategory.length === 0) {
      return res.status(404).json({ error: "No deals found in this category" });
    }

    // Generate images for each deal
    const results = await Promise.all(
      dealsInCategory.map(async (deal) => {
        try {
          const imageUrl = await getDrinkImage(
            deal.alcohol_category,
            deal.alcohol_subcategory || undefined
          );

          // Update the deal
          await db
            .update(deals)
            .set({ imageUrl })
            .where(eq(deals.id, deal.id));

          return {
            dealId: deal.id,
            success: true,
            imageUrl
          };
        } catch (error) {
          return {
            dealId: deal.id,
            success: false,
            error: error.message
          };
        }
      })
    );

    res.json({
      success: true,
      message: `Generated images for ${results.filter(r => r.success).length} out of ${dealsInCategory.length} deals`,
      results
    });
  } catch (error) {
    log(`Error generating images for category: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Generate sample images for each category
router.post("/generate-samples", async (req: Request, res: Response) => {
  try {
    const results = await generateSampleImages();
    res.json({
      success: true,
      message: "Generated sample images for all categories",
      results
    });
  } catch (error) {
    log(`Error generating sample images: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Generate images for all deals without images
router.post("/generate-missing", async (req: Request, res: Response) => {
  try {
    // Get all deals without images
    const dealsWithoutImages = await db
      .select()
      .from(deals)
      .where(eq(deals.imageUrl, ""));

    if (dealsWithoutImages.length === 0) {
      return res.json({ 
        success: true, 
        message: "No deals found without images" 
      });
    }

    // Generate images for each deal
    const results = await Promise.all(
      dealsWithoutImages.map(async (deal) => {
        try {
          const imageUrl = await getDrinkImage(
            deal.alcohol_category,
            deal.alcohol_subcategory || undefined
          );

          // Update the deal
          await db
            .update(deals)
            .set({ imageUrl })
            .where(eq(deals.id, deal.id));

          return {
            dealId: deal.id,
            success: true,
            imageUrl
          };
        } catch (error) {
          return {
            dealId: deal.id,
            success: false,
            error: error.message
          };
        }
      })
    );

    res.json({
      success: true,
      message: `Generated images for ${results.filter(r => r.success).length} out of ${dealsWithoutImages.length} deals`,
      results
    });
  } catch (error) {
    log(`Error generating missing images: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;