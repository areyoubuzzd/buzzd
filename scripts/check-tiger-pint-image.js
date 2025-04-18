// Script to analyze the working Tiger Pint image
import https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Working Tiger pint image URL
const imageUrl = 'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/tiger_pint/1.jpg';

// Function to check image headers and properties
async function analyzeImage(url) {
  return new Promise((resolve) => {
    https.get(url, (response) => {
      const statusCode = response.statusCode;
      const headers = response.headers;
      
      console.log(`\nAnalyzing image URL: ${url}`);
      console.log(`Status code: ${statusCode}`);
      console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
      console.log(`Content type: ${headers['content-type']}`);
      
      // Check for specific Cloudinary headers
      const cloudinaryHeaders = Object.keys(headers).filter(header => 
        header.toLowerCase().includes('cloudinary') || 
        header.toLowerCase().includes('cld')
      );
      
      if (cloudinaryHeaders.length > 0) {
        console.log(`\nFound Cloudinary-related headers:`);
        cloudinaryHeaders.forEach(header => {
          console.log(`  ${header}: ${headers[header]}`);
        });
      }
      
      // Check for potential version info
      const etagMatch = headers.etag ? headers.etag.match(/[0-9a-f]+/) : null;
      if (etagMatch) {
        console.log(`\nPotential version/hash in ETag: ${etagMatch[0]}`);
      }
      
      // Try to find image format and size hints
      if (headers['content-length']) {
        console.log(`\nContent length: ${headers['content-length']} bytes`);
      }
      
      // Try to extract version from URL or headers
      const versionMatch = url.match(/\/v[0-9]+\//);
      if (versionMatch) {
        console.log(`\nVersion in URL: ${versionMatch[0]}`);
      }
      
      // Complete the analysis
      console.log(`\nAnalysis complete!`);
      resolve();
    }).on('error', (err) => {
      console.error(`Error analyzing image: ${err.message}`);
      resolve();
    });
  });
}

// Create a URL with version number to test
function createURLWithVersion(baseUrl, version) {
  // Extract parts of the URL
  const parts = baseUrl.split('/upload/');
  if (parts.length !== 2) {
    console.error('URL format not recognized');
    return baseUrl;
  }
  
  // Construct new URL with version
  return `${parts[0]}/upload/v${version}/${parts[1]}`;
}

// Run the analysis
async function main() {
  // Analyze the working URL
  await analyzeImage(imageUrl);
  
  // Try with a few common version numbers
  const versionsToTry = [1744936154, 1744936160, 1744937000, 1744936000];
  
  for (const version of versionsToTry) {
    const urlWithVersion = createURLWithVersion(imageUrl, version);
    await analyzeImage(urlWithVersion);
  }
}

main();