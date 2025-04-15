import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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
    // Type can be 'beer', 'wine', or 'whisky'
    const { type } = req.body;
    
    if (!type || !['beer', 'wine', 'whisky'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: beer, wine, whisky' 
      });
    }
    
    // Build the prompt based on the drink type
    let prompt = '';
    switch (type) {
      case 'beer':
        prompt = 'A cold glass of beer on a restaurant table, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere';
        break;
      case 'wine':
        prompt = 'A glass of red wine on a restaurant table, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere';
        break;
      case 'whisky':
        prompt = 'A bottle of whisky with a glass on a restaurant table, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere';
        break;
    }
    
    console.log(`Generating ${type} image with OpenAI...`);
    
    // Generate the image with OpenAI
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    
    const imageUrl = response.data[0].url;
    
    // Return the generated image URL directly
    // In a production app, you might download and save the image
    return res.json({ 
      success: true, 
      type,
      imageUrl
    });
    
  } catch (error: any) {
    console.error('Error generating image:', error);
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message || 'Unknown error'
    });
  }
});

export default router;