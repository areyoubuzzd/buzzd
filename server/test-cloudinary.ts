import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryService } from './services/cloudinaryService';

// Use the same configuration as in the service - this will already be configured by the time this is imported
// so we don't need to reconfigure it here

export function testCloudinaryConnection(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    cloudinary.api.ping((error, result) => {
      if (error) {
        console.error('Cloudinary connection test failed:', error);
        reject(error);
        return;
      }
      console.log('Cloudinary connection test succeeded:', result);
      resolve(true);
    });
  });
}

export function logCloudinaryConfig() {
  console.log('Cloudinary configuration:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key_exists: !!process.env.CLOUDINARY_API_KEY,
    api_secret_exists: !!process.env.CLOUDINARY_API_SECRET
  });
}

export function generateTestUrls() {
  // Generate test URLs for various asset types using the SDK
  const sdkUrls = {
    backgrounds: {
      beer: cloudinary.url('backgrounds/beer/image', { 
        secure: true,
        transformation: [{ width: 800, height: 400, crop: 'fill' }]
      }),
      wine: cloudinary.url('backgrounds/wine/image', { 
        secure: true,
        transformation: [{ width: 800, height: 400, crop: 'fill' }] 
      }),
      cocktail: cloudinary.url('backgrounds/cocktail/image', { 
        secure: true,
        transformation: [{ width: 800, height: 400, crop: 'fill' }]
      })
    },
    brands: {
      beer: {
        heineken: {
          bottle: cloudinary.url('brands/beer/heineken/bottle', { 
            secure: true,
            transformation: [{ width: 200, crop: 'fill' }]
          }),
          glass: cloudinary.url('brands/beer/heineken/glass', { 
            secure: true,
            transformation: [{ width: 200, crop: 'fill' }]
          })
        }
      },
      cocktail: {
        margarita: {
          glass: cloudinary.url('brands/cocktail/margarita/glass', { 
            secure: true,
            transformation: [{ width: 200, crop: 'fill' }]
          })
        }
      }
    }
  };
  
  // Generate simple hardcoded demo URLs that work regardless of authentication status
  // These don't use the SDK but are direct URLs to the demo account
  const hardcodedUrls = {
    backgrounds: {
      beer: 'https://res.cloudinary.com/demo/image/upload/backgrounds/beer/image.jpg',
      wine: {
        red: 'https://res.cloudinary.com/demo/image/upload/backgrounds/wine/image.jpg',
        white: 'https://res.cloudinary.com/demo/image/upload/backgrounds/wine/white.jpg'
      },
      cocktail: 'https://res.cloudinary.com/demo/image/upload/backgrounds/cocktail/image.jpg',
      whisky: 'https://res.cloudinary.com/demo/image/upload/backgrounds/whisky/image.jpg',
      default: 'https://res.cloudinary.com/demo/image/upload/sample' // Sample image from demo account
    },
    brands: {
      beer: {
        heineken: {
          bottle: 'https://res.cloudinary.com/demo/image/upload/brands/beer/heineken/bottle.png',
          glass: 'https://res.cloudinary.com/demo/image/upload/brands/beer/heineken/glass.png'
        },
        default: {
          bottle: 'https://res.cloudinary.com/demo/image/upload/brands/beer/default/bottle.png',
          glass: 'https://res.cloudinary.com/demo/image/upload/bottle' // Using demo sample bottle
        }
      },
      cocktail: {
        margarita: {
          glass: 'https://res.cloudinary.com/demo/image/upload/brands/cocktail/margarita/glass.png'
        },
        default: {
          glass: 'https://res.cloudinary.com/demo/image/upload/sample' // Using demo sample
        }
      }
    }
  };
  
  return {
    sdkUrls,
    hardcodedUrls,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'demo'
  };
}