import OpenAI from "openai";
import cloudinary from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import axios from "axios";
import { log } from "../vite";

// Configure OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up error handler for missing environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is required for image generation");
}

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("Cloudinary configuration is incomplete. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET");
}

// Image generation templates for different drink types
const imagePrompts: Record<string, string[]> = {
  beer: [
    "A cold glass of beer on a wooden table with condensation, photorealistic, restaurant lighting",
    "A refreshing pint of beer with a frothy head, served in a branded glass on a bar counter, photorealistic",
    "A tall draft beer in a branded glass, golden color with a small head of foam, bar setting, photorealistic"
  ],
  "beer-bucket": [
    "A bucket filled with ice and five beers in bottles, on a restaurant table, photorealistic",
    "A galvanized metal bucket with ice and beer bottles, bar setting, restaurant lighting, photorealistic",
    "A promotional beer bucket with branded beer bottles chilling in ice, restaurant ambiance, photorealistic"
  ],
  wine: [
    "A glass of red wine on a table in a restaurant setting, soft lighting, photorealistic",
    "A glass of white wine with a bottle beside it, restaurant setting, elegant presentation, photorealistic",
    "A wine glass half-full with rosé wine, on a wooden table, soft restaurant lighting, photorealistic"
  ],
  cocktail: [
    "A colorful cocktail in a martini glass with a decorative garnish, bar setting, photorealistic",
    "A mixed drink in a tall glass with ice and a straw, colorful layers, bar counter, photorealistic",
    "A professionally prepared cocktail with fruit garnish, in an elegant glass, bar setting, photorealistic"
  ],
  spirit: [
    "A glass of whiskey with ice cubes and a bottle in the background, soft bar lighting, photorealistic",
    "A shot of clear spirit on a bar counter with a bottle nearby, bar setting, photorealistic",
    "A branded bottle of premium spirit with a glass and ice bucket, restaurant setting, photorealistic"
  ]
};

// Function to download an image from a URL
async function downloadImage(url: string, outputPath: string): Promise<string> {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    writer.on('finish', () => resolve(outputPath));
    writer.on('error', reject);
  });
}

// Function to generate an image using OpenAI DALL-E
async function generateImage(prompt: string, category: string, subcategory?: string): Promise<string> {
  try {
    log(`Generating image for ${category}${subcategory ? '/' + subcategory : ''} with prompt: ${prompt.substring(0, 50)}...`);
    
    // Generate image using OpenAI
    const response = await openai.images.generate({
      model: "dall-e-3", // the newest OpenAI model is "dall-e-3" which was released October 2023
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error("No image URL received from OpenAI");
    }

    // Create a temporary file to store the image
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `${uuidv4()}.png`);
    await downloadImage(imageUrl, tempFilePath);

    // Upload to Cloudinary
    const folder = subcategory 
      ? `happy-hour/drinks/${category}/${subcategory}` 
      : `happy-hour/drinks/${category}`;
    
    const cloudinaryResponse = await cloudinary.v2.uploader.upload(tempFilePath, {
      folder: folder,
      public_id: uuidv4(),
    });

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    log(`Successfully generated and uploaded image to Cloudinary: ${cloudinaryResponse.secure_url}`);
    return cloudinaryResponse.secure_url;
  } catch (error: any) {
    log(`Error generating image: ${error.message}`);
    throw error;
  }
}

// Main function to get or generate an image for a drink
export async function getDrinkImage(
  category: string, 
  subcategory?: string, 
  forceGenerate = false
): Promise<string> {
  try {
    let imageType = category.toLowerCase();
    
    // Special case for beer buckets
    if (category.toLowerCase() === 'beer' && subcategory?.toLowerCase()?.includes('bucket')) {
      imageType = 'beer-bucket';
    }
    
    // Check if we have templates for this drink type
    if (!imagePrompts[imageType]) {
      // Default to 'beer' if category not found
      imageType = 'beer';
    }
    
    // Get a random prompt from the templates
    const prompts = imagePrompts[imageType];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    // Enhance the prompt with specific details
    let enhancedPrompt = randomPrompt;
    if (subcategory && !imageType.includes('bucket')) {
      enhancedPrompt = `A ${subcategory.toLowerCase()} ${category.toLowerCase()}, ${randomPrompt.toLowerCase()}`;
    }
    
    // Generate the image
    return await generateImage(enhancedPrompt, category.toLowerCase(), subcategory?.toLowerCase());
  } catch (error: any) {
    log(`Error in getDrinkImage: ${error.message}`);
    throw error;
  }
}

// Generate images for all deal categories
export async function generateSampleImages(): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  for (const category of Object.keys(imagePrompts)) {
    try {
      const categoryFixed = category === 'beer-bucket' ? 'beer' : category;
      const subcategoryFixed = category === 'beer-bucket' ? 'bucket' : undefined;
      
      results[category] = await getDrinkImage(categoryFixed, subcategoryFixed);
    } catch (error: any) {
      log(`Error generating sample image for ${category}: ${error.message}`);
      results[category] = 'error';
    }
  }
  
  return results;
}