// Script to check uploaded drink images in Cloudinary
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Drink folders to check
const drinkFolders = [
  'home/brands/beer/heineken_pint',
  'home/brands/beer/tiger_pint',
  'home/brands/beer/carlsberg_pint',
  'home/brands/beer/sapporo_pint',
  'home/brands/cocktail/margarita',
  'home/brands/cocktail/mojito'
];

async function checkDrinkFolders() {
  console.log('Checking drink image folders...\n');
  
  for (const folder of drinkFolders) {
    console.log(`Checking folder: ${folder}`);
    
    try {
      console.log(`Checking Cloudinary configuration...`);
      console.log(`Cloud name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
      console.log(`API key present: ${process.env.CLOUDINARY_API_KEY ? 'Yes' : 'No'}`);
      console.log(`API secret present: ${process.env.CLOUDINARY_API_SECRET ? 'Yes' : 'No'}`);
      
      // Get all resources in the folder
      console.log(`Attempting to get resources for folder: ${folder}`);
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: 10
      });
      
      console.log(`✅ Found ${result.resources.length} images`);
      
      if (result.resources.length > 0) {
        // Log the found images
        result.resources.forEach((resource, index) => {
          // Extract just the filename from the public_id
          const parts = resource.public_id.split('/');
          const filename = parts[parts.length - 1];
          
          console.log(`  [${index + 1}] ${filename} (format: ${resource.format})`);
          console.log(`      URL: ${resource.secure_url}`);
        });
      } else {
        console.log('❌ No images found');
      }
    } catch (error) {
      console.error(`❌ Error checking folder ${folder}:`, error);
      console.error('Full error:', JSON.stringify(error, null, 2));
    }
    
    console.log(''); // Add spacing between folders
  }
}

// Run the check
checkDrinkFolders();