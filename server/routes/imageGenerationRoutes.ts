import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { generateDrinkImage } from '../services/openaiImageService';
import { updateDealImagesByCategory, getDealsWithoutImages } from '../services/dealImageService';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = Router();

// Directory to store generated images
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'generated-images');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Generate sample drink images using OpenAI
 */
router.post('/api/images/generate-sample', async (req: Request, res: Response) => {
  try {
    // Type can be 'beer', 'wine', 'whisky', 'cocktail', 'gin', 'vodka', 'rum' or any alcohol category
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({ 
        error: 'Missing drink type. Please provide "type" parameter.' 
      });
    }
    
    console.log(`Generating ${type} image with OpenAI...`);
    
    // Use our service to generate and save the image
    const imagePath = await generateDrinkImage(type);
    
    // Return the generated image path for client-side use
    return res.json({ 
      success: true, 
      type,
      imagePath,
      imageUrl: imagePath // For backward compatibility
    });
    
  } catch (error: any) {
    console.error('Error generating image:', error);
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message || 'Unknown error'
    });
  }
});

/**
 * Generate multiple sample drink images and assign them to deals
 * This can be used to populate the database with images for deals that don't have them
 */
router.post('/api/images/generate-batch', async (req: Request, res: Response) => {
  try {
    const { batchSize = 3 } = req.body;
    
    // List of drink categories to generate images for
    const drinkCategories = [
      'beer', 'wine', 'whisky', 'cocktail', 'gin', 'vodka', 'rum'
    ];
    
    const results = [];
    const categoryToImageMap: Record<string, string> = {};
    
    // Generate one image for each category, up to batchSize
    const categoriesToGenerate = drinkCategories.slice(0, batchSize);
    
    for (const category of categoriesToGenerate) {
      try {
        console.log(`Generating image for ${category}...`);
        const imagePath = await generateDrinkImage(category);
        
        categoryToImageMap[category] = imagePath;
        results.push({
          category,
          success: true,
          imagePath
        });
      } catch (error: any) {
        console.error(`Failed to generate image for ${category}:`, error);
        results.push({
          category,
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }
    
    // Update deals in the database with the generated images
    const { updatedDealIds, totalUpdated } = await updateDealImagesByCategory(categoryToImageMap);
    
    return res.json({
      success: true,
      results,
      categoryToImageMap,
      updatedDeals: {
        count: totalUpdated,
        ids: updatedDealIds
      }
    });
    
  } catch (error: any) {
    console.error('Error in batch image generation:', error);
    return res.status(500).json({
      error: 'Failed to generate batch images',
      details: error.message || 'Unknown error'
    });
  }
});

/**
 * Get a list of deals without images
 * This endpoint can be used to identify which deals need images
 */
router.get('/api/images/deals-without-images', async (_req: Request, res: Response) => {
  try {
    const limit = parseInt(_req.query.limit as string) || 50;
    const dealsWithoutImages = await getDealsWithoutImages(limit);
    
    return res.json({
      success: true,
      count: dealsWithoutImages.length,
      deals: dealsWithoutImages
    });
  } catch (error: any) {
    console.error('Error getting deals without images:', error);
    return res.status(500).json({
      error: 'Failed to get deals without images',
      details: error.message || 'Unknown error'
    });
  }
});

export default router;