import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Directory to store generated images
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'generated-images');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Download an image from a URL and save it to the local filesystem
 */
async function downloadImage(url: string, filename: string): Promise<string> {
  if (!url) {
    throw new Error('URL is required for downloading the image');
  }
  
  return new Promise((resolve, reject) => {
    const fullPath = path.join(UPLOAD_DIR, filename);
    const file = fs.createWriteStream(fullPath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(fullPath);
      });
      
      file.on('error', (err) => {
        fs.unlink(fullPath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(fullPath, () => {});
      reject(err);
    });
  });
}

/**
 * Generate a sample drink image
 */
export async function generateDrinkImage(type: string): Promise<string> {
  let prompt = '';
  
  switch (type.toLowerCase()) {
    case 'beer':
      prompt = 'A cold glass of beer on a restaurant table, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere';
      break;
    case 'wine':
      prompt = 'A glass of red wine on a restaurant table, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere';
      break;
    case 'whisky':
    case 'whiskey':
      prompt = 'A bottle of whisky with a glass on a restaurant table, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere';
      break;
    case 'cocktail':
      prompt = 'A colorful cocktail in a fancy glass, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere';
      break;
    case 'gin':
      prompt = 'A gin and tonic with lime in a highball glass, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere';
      break;
    case 'vodka':
      prompt = 'A vodka martini in a chilled glass, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere';
      break;
    case 'rum':
      prompt = 'A rum cocktail with tropical garnish, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere';
      break;
    default:
      prompt = 'A premium alcoholic drink on a restaurant table, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere';
  }
  
  console.log(`Generating ${type} image with OpenAI...`);
  
  try {
    // Generate the image with OpenAI
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    
    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('No image URL was returned from OpenAI');
    }
    
    // Download the image and save it
    const filename = `${type.toLowerCase()}-${uuidv4()}.png`;
    const savedPath = await downloadImage(imageUrl, filename);
    
    // Return the path relative to the public directory for client-side use
    return `/generated-images/${filename}`;
  } catch (error: any) {
    console.error('Error generating image:', error);
    throw new Error(`Failed to generate ${type} image: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Update deal images in the database
 */
export async function updateDealImages(db: any, categoryToImageMap: Record<string, string>): Promise<number> {
  // This would be implemented to update deal records in the database
  // with the generated images, using the provided db connection
  // For now, just return a count of how many would be updated
  return Object.keys(categoryToImageMap).length;
}