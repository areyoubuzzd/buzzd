// Script to check if Cloudinary images are available by directly checking URLs
import https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// URLs to check with different extensions
const urls = [
  // Heineken Pint images (user confirmed upload)
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/1.jpg',
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/1.jpeg',
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/1.svg',
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/1.png',
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/2.jpg',
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/3.jpg',
  
  // Asahi Pint images (user confirmed upload)
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/asahi_pint/1.jpg',
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/asahi_pint/1.jpeg',
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/asahi_pint/1.svg',
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/asahi_pint/1.png',
  
  // Red Wine images (user confirmed upload)
  // Assuming it's in the wine category with a "red_wine" folder
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/wine/red_wine/1.jpg',
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/wine/red_wine/1.jpeg',
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/wine/red_wine/1.svg',
  
  // Additional paths to check wine folder structures
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/wine/glass/red_wine/1.jpg',
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/wine/red/1.jpg',
  
  // Tiger Pint images (previously seemed to work)
  'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/tiger_pint/1.jpg',
  
  // Test for raw upload version explicitly (previously confirmed to work)
  'https://res.cloudinary.com/dp2uoj3ts/raw/upload/v1744936069/home/brands/beer/heineken_pint/1.txt'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (response) => {
      const statusCode = response.statusCode;
      const headers = response.headers;
      const contentType = headers['content-type'] || 'unknown';
      
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        let limitedData = data.length > 100 ? data.substring(0, 100) + '...' : data;
        resolve({
          url,
          statusCode,
          contentType,
          headers,
          available: statusCode >= 200 && statusCode < 300,
          dataPreview: limitedData
        });
      });
    }).on('error', (error) => {
      resolve({
        url,
        statusCode: 0,
        contentType: 'unknown',
        available: false,
        error: error.message
      });
    });
  });
}

async function checkAllUrls() {
  console.log('Checking Cloudinary image URLs...\n');
  
  for (const url of urls) {
    const result = await checkUrl(url);
    
    console.log(`URL: ${result.url}`);
    console.log(`Status: ${result.statusCode} (${result.available ? '✅ Available' : '❌ Not Available'})`);
    console.log(`Content-Type: ${result.contentType}`);
    
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    
    if (result.available && result.contentType.includes('text')) {
      console.log(`Content preview: ${result.dataPreview}`);
    }
    
    if (result.headers && result.headers['x-cld-error']) {
      console.log(`Cloudinary Error: ${result.headers['x-cld-error']}`);
    }
    
    console.log('\n---\n');
  }
}

// Run the check
checkAllUrls();