// Test script to check Cloudinary folder contents
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

async function testCloudinaryFolder() {
  try {
    console.log('Testing Cloudinary connection...');
    const pingResult = await cloudinary.api.ping();
    console.log('Cloudinary connection test result:', pingResult);
    
    // Check root folders first
    console.log('\nChecking main folders...');
    try {
      const rootResult = await cloudinary.api.root_folders();
      console.log('Root folders found:');
      rootResult.folders.forEach(folder => {
        console.log(`- ${folder.name} (path: ${folder.path})`);
      });
    } catch (error) {
      console.error('Error checking root folders:', error.message);
    }
    
    // Instead of using subfolders API, let's list resources with prefix
    try {
      console.log('\nChecking for contents in "home" folder...');
      const homeResult = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'home/',
        max_results: 20
      });
      
      console.log(`Found ${homeResult.resources.length} resources in home folder`);
      if (homeResult.resources.length > 0) {
        homeResult.resources.forEach(resource => {
          console.log(`- ${resource.public_id}`);
        });
      }
    } catch (error) {
      console.error('Error checking home folder:', error.message);
    }
    
    // Check for brands folder
    try {
      console.log('\nChecking for contents in "brands" folder...');
      const brandsResult = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'brands/',
        max_results: 20
      });
      
      console.log(`Found ${brandsResult.resources.length} resources in brands folder`);
      if (brandsResult.resources.length > 0) {
        brandsResult.resources.forEach(resource => {
          console.log(`- ${resource.public_id}`);
        });
      }
    } catch (error) {
      console.error('Error checking brands folder:', error.message);
    }
    
    // Test our specific folder path
    const folderPath = 'home/brands/beer/heineken_pint';
    console.log(`\nChecking specific folder: ${folderPath}`);
    
    // Get resources in folder
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
        max_results: 10
      });
      
      console.log(`Found ${result.resources.length} images in folder`);
      
      // Display details of found images
      if (result.resources.length > 0) {
        console.log('\nImages found:');
        result.resources.forEach((resource, index) => {
          console.log(`[${index + 1}] ${resource.public_id} (${resource.format})`);
          console.log(`    URL: ${resource.secure_url}`);
        });
      } else {
        console.log('No images found in this folder.');
      }
    } catch (error) {
      console.error(`Error checking folder ${folderPath}:`, error.message);
    }
    
    // Check if the default folder exists
    const defaultFolder = 'home/brands/beer/default';
    console.log(`\nChecking default folder: ${defaultFolder}`);
    
    const defaultResult = await cloudinary.api.resources({
      type: 'upload',
      prefix: defaultFolder,
      max_results: 10
    });
    
    console.log(`Found ${defaultResult.resources.length} images in default folder`);
    
    if (defaultResult.resources.length > 0) {
      console.log('\nDefault images found:');
      defaultResult.resources.forEach((resource, index) => {
        console.log(`[${index + 1}] ${resource.public_id} (${resource.format})`);
        console.log(`    URL: ${resource.secure_url}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing Cloudinary:', error);
  }
}

// Run the test
testCloudinaryFolder();