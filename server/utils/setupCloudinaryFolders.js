import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Define the folder structure to create
const folderStructure = {
  home: {
    backgrounds: {
      beer: {},
      wine: {},
      cocktail: {},
      whisky: {},
      vodka: {},
      rum: {},
      gin: {},
      default: {}
    },
    brands: {
      beer: {
        heineken: {},
        stella: {},
        carlsberg: {},
        tiger: {},
        'corona': {},
        bottle: { default: {} },
        glass: { default: {} }
      },
      wine: {
        red: {},
        white: {},
        rose: {},
        bottle: { default: {} },
        glass: { default: {} }
      },
      whisky: {
        'johnnie_walker': {},
        'jack_daniels': {},
        'macallan': {},
        'glenfiddich': {},
        bottle: { default: {} },
        glass: { default: {} }
      },
      vodka: {
        'grey_goose': {},
        'absolut': {},
        'smirnoff': {},
        bottle: { default: {} },
        glass: { default: {} }
      },
      gin: {
        'bombay_sapphire': {},
        'hendricks': {},
        'tanqueray': {},
        bottle: { default: {} },
        glass: { default: {} }
      },
      rum: {
        'bacardi': {},
        'captain_morgan': {},
        bottle: { default: {} },
        glass: { default: {} }
      },
      cocktail: {
        margarita: {},
        mojito: {},
        martini: {},
        'pina_colada': {},
        'long_island': {},
        'moscow_mule': {},
        'old_fashioned': {},
        daiquiri: {},
        cosmopolitan: {},
        glass: { default: {} }
      }
    },
    restaurants: {
      logos: {
        default: {}
      }
    }
  }
};

/**
 * Create a folder in Cloudinary
 * @param {string} folderPath - The folder path to create
 * @returns {Promise<object>} - Cloudinary response
 */
async function createFolder(folderPath) {
  try {
    const result = await cloudinary.api.create_folder(folderPath);
    console.log(`✅ Created folder: ${folderPath}`);
    return result;
  } catch (error) {
    // If folder already exists, we can ignore the error
    if (error.error && error.error.message.includes('already exists')) {
      console.log(`ℹ️ Folder already exists: ${folderPath}`);
      return { success: true, path: folderPath };
    }
    console.error(`❌ Error creating folder ${folderPath}:`, error);
    throw error;
  }
}

/**
 * Recursively create the folder structure in Cloudinary
 * @param {object} structure - The folder structure object
 * @param {string} parentPath - The parent path
 * @returns {Promise<void>}
 */
async function createFolderStructure(structure, parentPath = '') {
  for (const [folderName, subFolders] of Object.entries(structure)) {
    const currentPath = parentPath ? `${parentPath}/${folderName}` : folderName;
    
    if (Object.keys(subFolders).length > 0) {
      // Create this folder if it's not the root
      if (currentPath !== 'home') {
        await createFolder(currentPath);
      }
      
      // Recursively create subfolders
      await createFolderStructure(subFolders, currentPath);
    } else {
      // This is a leaf folder (no subfolders)
      await createFolder(currentPath);
    }
  }
}

/**
 * Set up the complete Cloudinary folder structure
 */
async function setupCloudinaryFolders() {
  try {
    console.log('Starting Cloudinary folder structure setup...');
    
    // Check connection to Cloudinary
    const pingResult = await cloudinary.api.ping();
    if (pingResult.status !== 'ok') {
      throw new Error('Cloudinary connection failed');
    }
    console.log('Cloudinary connection verified ✅');
    
    // Create the folder structure
    await createFolderStructure(folderStructure);
    
    console.log('Cloudinary folder structure setup complete! ✅');
    return true;
  } catch (error) {
    console.error('Error setting up Cloudinary folder structure:', error);
    return false;
  }
}

// Export the setup function
export default setupCloudinaryFolders;