/**
 * Script to test various Cloudinary URL formats
 * Run with: node scripts/test-cloudinary-formats.js
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize dotenv
dotenv.config();

// Get Cloudinary credentials from environment
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

// Array of possible URL formats to test
const urlFormats = [
  // Direct version-based URLs
  `https://res.cloudinary.com/${cloudName}/image/upload/v1744936265/1.jpg`,
  `https://res.cloudinary.com/${cloudName}/image/upload/v1744936265/2.jpg`,
  `https://res.cloudinary.com/${cloudName}/image/upload/v1744936265/3.jpg`,
  
  // Various folder structures
  `https://res.cloudinary.com/${cloudName}/image/upload/tiger_pint_1.jpg`,
  `https://res.cloudinary.com/${cloudName}/image/upload/heineken_pint_1.jpg`,
  
  // Folder structure with drink category
  `https://res.cloudinary.com/${cloudName}/image/upload/beer/tiger_pint/1.jpg`,
  `https://res.cloudinary.com/${cloudName}/image/upload/beer/heineken_pint/1.jpg`,
  
  // Home/brands structure
  `https://res.cloudinary.com/${cloudName}/image/upload/home/brands/beer/tiger_pint/1.jpg`,
  `https://res.cloudinary.com/${cloudName}/image/upload/home/brands/beer/heineken_pint/1.jpg`,
  
  // Public IDs with transformation
  `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_400,c_fill/tiger_pint_1`,
  `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_400,c_fill/heineken_pint_1`,
  
  // Raw public ID with no path
  `https://res.cloudinary.com/${cloudName}/image/upload/1`,
  `https://res.cloudinary.com/${cloudName}/image/upload/2`,
  
  // Try drinks folder directly
  `https://res.cloudinary.com/${cloudName}/image/upload/drinks/tiger_pint_1`,
  `https://res.cloudinary.com/${cloudName}/image/upload/drinks/heineken_pint_1`,
];

// Function to check if a URL exists
async function checkUrl(url) {
  try {
    const response = await axios.head(url);
    if (response.status === 200) {
      console.log(`✅ URL exists: ${url}`);
      return true;
    } else {
      console.log(`❌ URL doesn't exist (status ${response.status}): ${url}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking URL: ${url}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Main function to test all URL formats
async function testAllFormats() {
  console.log(`Testing Cloudinary URLs for cloud name: ${cloudName}`);
  console.log('----------------------------------------');
  
  let foundUrls = 0;
  
  // Check each URL format
  for (const url of urlFormats) {
    const exists = await checkUrl(url);
    if (exists) foundUrls++;
  }
  
  console.log('----------------------------------------');
  console.log(`Found ${foundUrls} of ${urlFormats.length} possible URL formats`);
  
  if (foundUrls === 0) {
    console.log('\nSUGGESTIONS:');
    console.log('1. Make sure your CLOUDINARY_CLOUD_NAME environment variable is correctly set');
    console.log('2. Verify that you have uploaded images to Cloudinary');
    console.log('3. Check if your Cloudinary account is active and properly configured');
    console.log('4. Try uploading a test image and checking its URL in the Cloudinary Media Library');
  }
}

// Run the tests
testAllFormats();