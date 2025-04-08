import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with demo account for now
cloudinary.config({
  cloud_name: 'demo',
  api_key: 'test',
  api_secret: 'test'
});

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
  // Use demo as the cloud name
  const cloudName = 'demo';
  
  // Generate test URLs for various asset types
  return {
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
}