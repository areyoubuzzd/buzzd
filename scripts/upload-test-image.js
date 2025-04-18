// Test script to upload an image to Cloudinary
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create a simple test image
async function createTestImage() {
  // Create a temporary directory if it doesn't exist
  const tempDir = './temp';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  // Create a simple text file as our "test image"
  const testFilePath = path.join(tempDir, 'test_upload.txt');
  fs.writeFileSync(testFilePath, 'This is a test file for Cloudinary upload');
  
  return testFilePath;
}

async function uploadTestImage() {
  try {
    console.log('Testing Cloudinary upload...');
    
    // Create test file
    const testFilePath = await createTestImage();
    console.log(`Created test file at: ${testFilePath}`);
    
    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    
    // Try to upload to home/brands/beer/heineken_pint
    const targetFolder = 'home/brands/beer/heineken_pint';
    const uploadResult = await cloudinary.uploader.upload(testFilePath, {
      folder: targetFolder,
      public_id: '1',
      resource_type: 'raw', // Since we're uploading a text file
      overwrite: true
    });
    
    console.log('Upload successful!');
    console.log('Results:', uploadResult);
    console.log(`File URL: ${uploadResult.secure_url}`);
    
    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('Test file cleaned up');
  } catch (error) {
    console.error('Error uploading test file:', error);
  }
}

// Run the test
uploadTestImage();