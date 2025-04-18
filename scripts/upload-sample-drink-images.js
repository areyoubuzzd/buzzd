// Script to upload sample drink images to Cloudinary
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import https from 'https';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create temp directory if it doesn't exist
const tempDir = './temp';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Sample drinks with folder paths and placeholder image URLs
// In a real scenario, you would use actual image URLs or local file paths
const sampleDrinks = [
  {
    name: 'Heineken Pint',
    folder: 'home/brands/beer/heineken_pint',
    imageUrl: 'https://placehold.co/400x400/00594C/FFFFFF?text=Heineken+Pint'
  },
  {
    name: 'Tiger Pint',
    folder: 'home/brands/beer/tiger_pint',
    imageUrl: 'https://placehold.co/400x400/F2A900/000000?text=Tiger+Pint'
  },
  {
    name: 'Carlsberg Pint',
    folder: 'home/brands/beer/carlsberg_pint',
    imageUrl: 'https://placehold.co/400x400/2B8543/FFFFFF?text=Carlsberg+Pint'
  },
  {
    name: 'Sapporo Pint',
    folder: 'home/brands/beer/sapporo_pint',
    imageUrl: 'https://placehold.co/400x400/12284B/FFFFFF?text=Sapporo+Pint'
  },
  {
    name: 'Margarita',
    folder: 'home/brands/cocktail/margarita',
    imageUrl: 'https://placehold.co/400x400/66CA98/000000?text=Margarita'
  },
  {
    name: 'Mojito',
    folder: 'home/brands/cocktail/mojito',
    imageUrl: 'https://placehold.co/400x400/C2E8D8/000000?text=Mojito'
  }
];

// Function to download an image from a URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: HTTP status ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded image to: ${filepath}`);
        resolve(filepath);
      });
      
      fileStream.on('error', (err) => {
        fs.unlinkSync(filepath);
        reject(err);
      });
    }).on('error', reject);
  });
}

// Function to upload an image to Cloudinary
async function uploadImageToCloudinary(localPath, folder, filename, extension) {
  try {
    console.log(`Uploading ${localPath} to ${folder}/${filename}.${extension}...`);
    
    const uploadResult = await cloudinary.uploader.upload(localPath, {
      folder: folder,
      public_id: filename,
      overwrite: true
    });
    
    console.log(`✅ Upload successful!`);
    console.log(`URL: ${uploadResult.secure_url}`);
    
    return uploadResult;
  } catch (error) {
    console.error(`❌ Error uploading file:`, error);
    throw error;
  }
}

// Main function to upload sample drink images
async function uploadSampleDrinkImages() {
  console.log('Starting upload of sample drink images...');
  
  for (const drink of sampleDrinks) {
    try {
      console.log(`\nProcessing ${drink.name}...`);
      
      // For each drink, we'll upload 3 sample images with different extensions
      for (let i = 1; i <= 3; i++) {
        // Alternate between jpg and jpeg to test both extensions
        const extension = i % 2 === 0 ? 'jpeg' : 'jpg';
        
        // Create a local file path
        const localFilePath = path.join(tempDir, `${drink.name.toLowerCase().replace(/\s+/g, '_')}_${i}.${extension}`);
        
        // Download the image
        await downloadImage(drink.imageUrl, localFilePath);
        
        // Upload to Cloudinary
        await uploadImageToCloudinary(localFilePath, drink.folder, i.toString(), extension);
        
        // Clean up local file
        fs.unlinkSync(localFilePath);
        console.log(`Deleted temporary file: ${localFilePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${drink.name}:`, error);
    }
  }
  
  console.log('\nSample drink image upload process completed!');
}

// Run the upload process
uploadSampleDrinkImages();