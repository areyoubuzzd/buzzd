import fs from 'fs';
import path from 'path';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create necessary directories
const baseDir = path.join(process.cwd(), 'public/images/drinks');
const categories = ['beer', 'wine', 'cocktail', 'spirit_whisky'];

// Ensure directories exist
categories.forEach(category => {
  const dir = path.join(baseDir, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Sample image URLs with reliable sources
const imageUrls = {
  beer: [
    'https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg',
    'https://images.pexels.com/photos/1269025/pexels-photo-1269025.jpeg',
    'https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg'
  ],
  wine: [
    'https://images.pexels.com/photos/1407846/pexels-photo-1407846.jpeg',
    'https://images.pexels.com/photos/2912108/pexels-photo-2912108.jpeg',
    'https://images.pexels.com/photos/2775860/pexels-photo-2775860.jpeg'
  ],
  cocktail: [
    'https://images.pexels.com/photos/2480828/pexels-photo-2480828.jpeg',
    'https://images.pexels.com/photos/2789328/pexels-photo-2789328.jpeg',
    'https://images.pexels.com/photos/3407778/pexels-photo-3407778.jpeg'
  ],
  spirit_whisky: [
    'https://images.pexels.com/photos/5947029/pexels-photo-5947029.jpeg',
    'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg',
    'https://images.pexels.com/photos/7218637/pexels-photo-7218637.jpeg'
  ]
};

// Known image IDs from logs
const knownIds = {
  beer: [
    '71f8fefd-a48f-4b1d-651f-fe2bbff72300',
    '8f08a33e-5ea3-43a1-95fc-9d4513a4f000',
    '6efaa9d0-ac8e-4f05-85c3-a5c0d4bdb900',
    'c07d8f2e-c9a1-4fb6-b707-01a0a675c100'
  ],
  wine: [
    '3e9bde37-6c4d-448e-85fc-3be2fd4f8100',
    '508c82b8-5011-4fe7-af20-01ce95fca400',
    '237b2f83-77c7-4d53-a253-0459d9b73200'
  ]
};

// Download an image from a URL
function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded: ${filePath}`);
        resolve(filePath);
      });

      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file if there's an error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Download images for all categories
async function downloadAllImages() {
  const downloadPromises = [];

  // Use known IDs first where available
  for (const [category, ids] of Object.entries(knownIds)) {
    const urls = imageUrls[category] || [];
    
    ids.forEach((id, index) => {
      if (index < urls.length) {
        const filePath = path.join(baseDir, category, `${id}.jpeg`);
        downloadPromises.push(downloadImage(urls[index], filePath));
      }
    });
  }

  // Add some additional random images
  for (const [category, urls] of Object.entries(imageUrls)) {
    urls.forEach((url) => {
      const id = uuidv4();
      const filePath = path.join(baseDir, category, `${id}.jpeg`);
      
      // Only add if we haven't used this URL already
      if (!downloadPromises.some(p => p._url === url)) {
        const promise = downloadImage(url, filePath);
        promise._url = url; // Tag the promise with the URL for deduplication
        downloadPromises.push(promise);
      }
    });
  }

  try {
    await Promise.all(downloadPromises);
    console.log('All images downloaded successfully!');
  } catch (error) {
    console.error('Error downloading images:', error);
  }
}

downloadAllImages();