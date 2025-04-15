import 'dotenv/config';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { createWriteStream } from 'fs';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function to generate an image with OpenAI
async function generateImage(prompt) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data[0].url;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

// Create the directory for storing images if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, '..', '..', 'public', 'sample-drinks');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Generate sample images for each drink type
async function generateSampleImages() {
  const drinkTypes = [
    {
      name: 'beer',
      prompt: 'A cold glass of beer on a restaurant table, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere'
    },
    {
      name: 'wine',
      prompt: 'A glass of red wine on a restaurant table, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere'
    },
    {
      name: 'whisky',
      prompt: 'A bottle of whisky with a glass on a restaurant table, high-resolution, professional photography, warm lighting, appetizing, restaurant atmosphere'
    }
  ];

  for (const drink of drinkTypes) {
    try {
      console.log(`Generating image for ${drink.name}...`);
      const imageUrl = await generateImage(drink.prompt);
      
      // Log the URL (you would typically download this in a production app)
      console.log(`Generated image URL for ${drink.name}: ${imageUrl}`);
      
      // Here you could add code to download the image if needed
      // In this sample, we're just logging the URL
    } catch (error) {
      console.error(`Failed to generate image for ${drink.name}:`, error);
    }
  }
}

// Execute the function
generateSampleImages()
  .then(() => console.log('Sample image generation complete'))
  .catch(err => console.error('Error in sample image generation:', err));