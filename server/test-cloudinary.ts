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
      red_wine: cloudinary.url('backgrounds/red_wine/image', { 
        secure: true,
        transformation: [{ width: 800, height: 400, crop: 'fill' }] 
      }),
      white_wine: cloudinary.url('backgrounds/white_wine/image', { 
        secure: true,
        transformation: [{ width: 800, height: 400, crop: 'fill' }] 
      }),
      bubbly: cloudinary.url('backgrounds/bubbly/image', { 
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
        },
        asahi: {
          glass: cloudinary.url('brands/beer/asahi/glass', { 
            secure: true,
            transformation: [{ width: 200, crop: 'fill' }]
          })
        }
      },
      bubbly: {
        prosecco: {
          glass: cloudinary.url('brands/bubbly/prosecco/glass', { 
            secure: true,
            transformation: [{ width: 200, crop: 'fill' }]
          })
        }
      },
      whisky: {
        monkey_shoulder: {
          bottle: cloudinary.url('brands/whisky/monkey_shoulder/bottle', { 
            secure: true,
            transformation: [{ width: 200, crop: 'fill' }]
          })
        },
        jack_daniels: {
          bottle: cloudinary.url('brands/whisky/jack_daniels/bottle', { 
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
  
  // Generate hardcoded URLs using the current cloud name
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'demo';
  const hardcodedUrls = {
    backgrounds: {
      beer: `https://res.cloudinary.com/${cloudName}/image/upload/backgrounds/beer/image.png`,
      red_wine: `https://res.cloudinary.com/${cloudName}/image/upload/backgrounds/red_wine/image.png`,
      white_wine: `https://res.cloudinary.com/${cloudName}/image/upload/backgrounds/white_wine/image.png`,
      bubbly: `https://res.cloudinary.com/${cloudName}/image/upload/backgrounds/bubbly/image.png`,
      cocktail: `https://res.cloudinary.com/${cloudName}/image/upload/backgrounds/cocktail/image.png`,
      whisky: `https://res.cloudinary.com/${cloudName}/image/upload/backgrounds/whisky/image.png`,
      default: `https://res.cloudinary.com/${cloudName}/image/upload/sample` // Sample image
    },
    brands: {
      beer: {
        heineken: {
          bottle: `https://res.cloudinary.com/${cloudName}/image/upload/brands/beer/heineken/bottle.png`,
          glass: `https://res.cloudinary.com/${cloudName}/image/upload/brands/beer/heineken/glass.png`
        },
        asahi: {
          glass: `https://res.cloudinary.com/${cloudName}/image/upload/brands/beer/asahi/glass.png`
        },
        default: {
          bottle: `https://res.cloudinary.com/${cloudName}/image/upload/brands/beer/default/bottle.png`,
          glass: `https://res.cloudinary.com/${cloudName}/image/upload/bottle` // Generic bottle
        }
      },
      bubbly: {
        prosecco: {
          glass: `https://res.cloudinary.com/${cloudName}/image/upload/brands/bubbly/prosecco/glass.png`
        }
      },
      whisky: {
        monkey_shoulder: {
          bottle: `https://res.cloudinary.com/${cloudName}/image/upload/brands/whisky/monkey_shoulder/bottle.png`
        },
        jack_daniels: {
          bottle: `https://res.cloudinary.com/${cloudName}/image/upload/brands/whisky/jack_daniels/bottle.png`
        }
      },
      cocktail: {
        margarita: {
          glass: `https://res.cloudinary.com/${cloudName}/image/upload/brands/cocktail/margarita/glass.png`
        },
        default: {
          glass: `https://res.cloudinary.com/${cloudName}/image/upload/sample` // Generic image
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