// Script to try accessing images with version numbers
import https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Base folders to check
const folders = [
  'home/brands/beer/heineken_pint',
  'home/brands/beer/asahi_pint',
  'home/brands/wine/red_wine',
  // The working one for comparison
  'home/brands/beer/tiger_pint'
];

// Version range to try (from what we know worked)
const versionStart = 1744936000;
const versionEnd = 1744938000;
const versionStep = 100;

// Extensions to try
const extensions = ['jpg', 'jpeg', 'svg', 'png'];

// Function to check URL
function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        console.log(`✅ [${response.statusCode}] Found working URL: ${url}`);
        console.log(`   Content-Type: ${response.headers['content-type']}`);
        
        if (response.headers['server-timing']) {
          // Extract useful info from server-timing header
          const serverTiming = response.headers['server-timing'];
          if (serverTiming.includes('ocrt=')) {
            const match = serverTiming.match(/ocrt=(\d+)/);
            if (match) {
              console.log(`   Original creation timestamp: ${match[1]}`);
            }
          }
          
          if (serverTiming.includes('content-info')) {
            console.log(`   Server info: ${serverTiming}`);
          }
        }
        
        console.log(''); // Spacing
      }
      
      resolve({
        url,
        statusCode: response.statusCode,
        headers: response.headers
      });
    }).on('error', (error) => {
      console.error(`❌ Error checking ${url}: ${error.message}`);
      resolve({
        url,
        error: error.message
      });
    });
  });
}

// Function to create versioned URL
function createVersionedUrl(folder, version, extension) {
  return `https://res.cloudinary.com/dp2uoj3ts/image/upload/v${version}/${folder}/1.${extension}`;
}

// Run a systematic check
async function runCheck() {
  console.log('Starting systematic URL check for Cloudinary images...\n');
  
  // First, check basic URLs without versions
  for (const folder of folders) {
    for (const ext of extensions) {
      const url = `https://res.cloudinary.com/dp2uoj3ts/image/upload/${folder}/1.${ext}`;
      await checkUrl(url);
    }
  }
  
  console.log('\n---------- Now trying with version numbers ----------\n');
  
  // Try specific versions from our known working range
  const versionsToTry = [];
  for (let v = versionStart; v <= versionEnd; v += versionStep) {
    versionsToTry.push(v);
  }
  
  // Also add some specific versions we've seen
  const specificVersions = [1744936154, 1744936157, 1744936159, 1744936160, 1744936163];
  versionsToTry.push(...specificVersions);
  
  // For each version, only try a smaller set to avoid too many requests
  for (const folder of folders) {
    console.log(`\nChecking folder: ${folder}`);
    
    // Try SVG extension first as that's what our upload became
    for (const version of versionsToTry) {
      const url = createVersionedUrl(folder, version, 'svg');
      await checkUrl(url);
    }
    
    // Try jpg with just a few versions
    for (const version of specificVersions) {
      const url = createVersionedUrl(folder, version, 'jpg');
      await checkUrl(url);
    }
  }
  
  console.log('\nCheck completed!');
}

runCheck();