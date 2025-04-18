/**
 * Script to test wine image URLs with the new format
 * Run with: node scripts/test-wine-images.js
 */

import https from 'https';

/**
 * Check if a URL exists and returns a 200 status code
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - Whether the URL returns a 200 status
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`${url} => Status: ${res.statusCode}`);
      resolve(res.statusCode === 200);
    }).on('error', (err) => {
      console.error(`Error checking ${url}: ${err.message}`);
      resolve(false);
    });
  });
}

/**
 * Test a set of URLs for both .jpg and .webp formats
 */
async function testUrls() {
  const cloudName = 'dp2uoj3ts';
  const basePath = `https://res.cloudinary.com/${cloudName}/image/upload`;
  
  // Test URLs
  const urls = [
    // Test the exact working URL from the user
    `${basePath}/v1744942262/home/brands/wine/red/2.webp`,
    
    // Test other numbers with the same format
    `${basePath}/v1744942262/home/brands/wine/red/1.webp`,
    `${basePath}/v1744942262/home/brands/wine/red/3.webp`,
    
    // Test white wine with the same format
    `${basePath}/v1744942262/home/brands/wine/white/1.webp`,
    
    // Test without version number
    `${basePath}/home/brands/wine/red/2.webp`,
    
    // Test old paths with jpg
    `${basePath}/home/brands/wine/red_wine/1.jpg`,
    `${basePath}/home/brands/wine/white_wine/1.jpg`,
  ];

  console.log("Testing wine image URLs...");
  for (const url of urls) {
    await checkUrl(url);
  }
}

// Run the tests
testUrls().catch(console.error);