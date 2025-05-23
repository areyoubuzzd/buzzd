import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Cloudinary uploader utility functions
 */
const cloudinaryUploader = {
  /**
   * Upload a background image for an alcohol category
   * @param {string} filePath - Local path to the image file
   * @param {string} category - Alcohol category (beer, wine, cocktail, etc.)
   * @returns {Promise<object>} - Cloudinary upload result
   */
  async uploadBackgroundImage(filePath, category) {
    try {
      const formattedCategory = category.toLowerCase().replace(/\s+/g, '_');
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `home/backgrounds/${formattedCategory}`,
        public_id: 'image',
        overwrite: true,
        resource_type: 'image'
      });
      
      console.log(`✅ Successfully uploaded background image for ${category}`);
      console.log(`URL: ${result.secure_url}`);
      return result;
    } catch (error) {
      console.error(`❌ Error uploading background image: ${error.message}`);
      throw error;
    }
  },

  /**
   * Upload a brand image (bottle or glass) for a specific alcohol
   * @param {string} filePath - Local path to the image file
   * @param {string} category - Alcohol category (beer, wine, whisky, etc.)
   * @param {string} brandName - Name of the brand
   * @param {string} servingStyle - 'bottle' or 'glass'
   * @returns {Promise<object>} - Cloudinary upload result
   */
  async uploadBrandImage(filePath, category, brandName, servingStyle = 'bottle') {
    try {
      const formattedCategory = category.toLowerCase().replace(/\s+/g, '_');
      const formattedBrand = brandName.toLowerCase().replace(/\s+/g, '_');
      const serving = servingStyle.toLowerCase();

      // Make sure serving style is either bottle or glass
      if (!['bottle', 'glass'].includes(serving)) {
        throw new Error('Serving style must be either "bottle" or "glass"');
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder: `home/brands/${formattedCategory}/${formattedBrand}`,
        public_id: serving,
        overwrite: true,
        resource_type: 'image'
      });
      
      console.log(`✅ Successfully uploaded ${serving} image for ${brandName} ${category}`);
      console.log(`URL: ${result.secure_url}`);
      return result;
    } catch (error) {
      console.error(`❌ Error uploading brand image: ${error.message}`);
      throw error;
    }
  },

  /**
   * Upload a cocktail image
   * @param {string} filePath - Local path to the image file
   * @param {string} cocktailName - Name of the cocktail
   * @returns {Promise<object>} - Cloudinary upload result
   */
  async uploadCocktailImage(filePath, cocktailName) {
    try {
      const formattedName = cocktailName.toLowerCase().replace(/\s+/g, '_');
      
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `home/brands/cocktail/${formattedName}`,
        public_id: 'glass', // Cocktails are always served in glasses
        overwrite: true,
        resource_type: 'image'
      });
      
      console.log(`✅ Successfully uploaded image for ${cocktailName} cocktail`);
      console.log(`URL: ${result.secure_url}`);
      return result;
    } catch (error) {
      console.error(`❌ Error uploading cocktail image: ${error.message}`);
      throw error;
    }
  },

  /**
   * Upload a restaurant logo
   * @param {string} filePath - Local path to the image file
   * @param {string} restaurantId - Restaurant ID
   * @returns {Promise<object>} - Cloudinary upload result
   */
  async uploadRestaurantLogo(filePath, restaurantId) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'home/restaurants/logos',
        public_id: restaurantId,
        overwrite: true,
        resource_type: 'image'
      });
      
      console.log(`✅ Successfully uploaded logo for restaurant ID: ${restaurantId}`);
      console.log(`URL: ${result.secure_url}`);
      return result;
    } catch (error) {
      console.error(`❌ Error uploading restaurant logo: ${error.message}`);
      throw error;
    }
  },

  /**
   * Upload a default image for a category or type
   * @param {string} filePath - Local path to the image file
   * @param {string} type - Type of default image ('background', 'bottle', 'glass', 'logo')
   * @param {string} category - Optional category for bottles/glasses
   * @returns {Promise<object>} - Cloudinary upload result
   */
  async uploadDefaultImage(filePath, type, category = null) {
    try {
      let folder;
      let publicId = 'default';

      switch (type) {
        case 'background':
          folder = 'home/backgrounds/default';
          publicId = 'image';
          break;
        case 'bottle':
        case 'glass':
          if (!category) throw new Error('Category is required for bottle/glass defaults');
          const formattedCategory = category.toLowerCase().replace(/\s+/g, '_');
          folder = `home/brands/${formattedCategory}/${type}`;
          break;
        case 'logo':
          folder = 'home/restaurants/logos';
          break;
        default:
          throw new Error('Invalid default image type. Use "background", "bottle", "glass", or "logo"');
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image'
      });
      
      console.log(`✅ Successfully uploaded default ${type} image${category ? ' for ' + category : ''}`);
      console.log(`URL: ${result.secure_url}`);
      return result;
    } catch (error) {
      console.error(`❌ Error uploading default image: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get Cloudinary folder structure
   * @returns {object} - Object containing the folder structure
   */
  getFolderStructure() {
    return {
      backgrounds: {
        description: 'Background images for alcohol categories',
        path: 'home/backgrounds/[category]/image.png',
        examples: [
          'home/backgrounds/beer/image.png',
          'home/backgrounds/red_wine/image.png',
          'home/backgrounds/white_wine/image.png',
          'home/backgrounds/bubbly/image.png',
          'home/backgrounds/cocktail/image.png',
          'home/backgrounds/default/image.png (fallback)'
        ]
      },
      brands: {
        description: 'Brand images for specific alcohols',
        path: 'home/brands/[category]/[brand]/[bottle|glass].png',
        examples: [
          'home/brands/beer/heineken/bottle.png',
          'home/brands/beer/heineken/glass.png',
          'home/brands/red_wine/merlot/bottle.png',
          'home/brands/white_wine/chardonnay/glass.png',
          'home/brands/bubbly/champagne/bottle.png',
          'home/brands/whisky/johnnie_walker/bottle.png'
        ]
      },
      cocktails: {
        description: 'Cocktail images',
        path: 'home/brands/cocktail/[cocktail_name]/glass.png',
        examples: [
          'home/brands/cocktail/margarita/glass.png',
          'home/brands/cocktail/mojito/glass.png'
        ]
      },
      restaurants: {
        description: 'Restaurant logos',
        path: 'home/restaurants/logos/[restaurant_id].png',
        examples: [
          'home/restaurants/logos/123.png',
          'home/restaurants/logos/default.png (fallback)'
        ]
      }
    };
  },

  /**
   * Test Cloudinary connection
   * @returns {Promise<boolean>} - True if connection is successful
   */
  async testConnection() {
    try {
      const testResult = await cloudinary.api.ping();
      return testResult.status === 'ok';
    } catch (error) {
      console.error('Cloudinary connection test failed:', error);
      return false;
    }
  },

  /**
   * Get all images from a folder
   * @param {string} folderPath - Path to the folder in Cloudinary
   * @returns {Promise<Array>} - Array of image resources in the folder
   */
  async getImagesFromFolder(folderPath) {
    try {
      // Use the resources API to get all images in the specified folder
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
        max_results: 100 // Adjust based on your needs
      });
      
      console.log(`Found ${result.resources.length} images in folder: ${folderPath}`);
      return result.resources;
    } catch (error) {
      console.error(`Error fetching images from folder ${folderPath}:`, error);
      // Return empty array instead of throwing to avoid breaking the UI
      return [];
    }
  },
  
  /**
   * Check if an image exists with a specific extension
   * @param {string} basePath - Base path without extension
   * @param {string} extension - File extension to check
   * @returns {Promise<boolean>} - Whether the image exists
   */
  async checkImageWithExtension(basePath, extension) {
    try {
      const fullPath = `${basePath}.${extension}`;
      // Use the resources API to check if the image exists
      await cloudinary.api.resource(fullPath);
      return true; // If it doesn't throw, the image exists
    } catch (error) {
      // The image probably doesn't exist with this extension
      return false;
    }
  },

  /**
   * Get a random image URL from a folder for a specific drink
   * This version supports both .jpg and .jpeg extensions
   * @param {string} category - Alcohol category (beer, wine, whisky, etc.)
   * @param {string} drinkName - Name of the drink (e.g., "Heineken")
   * @param {string} servingStyle - 'bottle' or 'glass'
   * @returns {Promise<string|null>} - Random image URL or null if none found
   */
  async getRandomDrinkImageUrl(category, drinkName, servingStyle = 'glass') {
    try {
      if (!category || !drinkName) {
        return null;
      }
      
      const formattedCategory = category.toLowerCase().replace(/\s+/g, '_');
      const formattedDrink = drinkName.toLowerCase().replace(/\s+/g, '_');
      
      // Folder path for this specific drink
      const baseFolderPath = `home/brands/${formattedCategory}/${formattedDrink}`;
      console.log(`Looking for images in folder: ${baseFolderPath}`);
      
      // Get all images in the folder (this will get both .jpg and .jpeg)
      const images = await this.getImagesFromFolder(baseFolderPath);
      console.log(`Found ${images.length} images in ${baseFolderPath}`);
      
      if (images.length === 0) {
        console.log(`No images found for ${drinkName}. Using default.`);
        // Try the category default as fallback
        const defaultFolderPath = `home/brands/${formattedCategory}/default`;
        const defaultImages = await this.getImagesFromFolder(defaultFolderPath);
        
        if (defaultImages.length === 0) {
          return null;
        }
        
        // Pick a random image from the defaults
        const randomDefaultImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];
        return randomDefaultImage.secure_url;
      }
      
      // Filter images to only include .jpg and .jpeg files
      const jpgImages = images.filter(img => 
        img.public_id.endsWith('.jpg') || 
        img.format === 'jpg'
      );
      
      const jpegImages = images.filter(img => 
        img.public_id.endsWith('.jpeg') || 
        img.format === 'jpeg'
      );
      
      // Combine all available images
      const validImages = [...jpgImages, ...jpegImages];
      
      if (validImages.length === 0) {
        console.log(`No valid image formats found for ${drinkName}. Using default.`);
        return null;
      }
      
      // Pick a random image from the filtered results
      const randomImage = validImages[Math.floor(Math.random() * validImages.length)];
      console.log(`Selected random image: ${randomImage.public_id}`);
      return randomImage.secure_url;
    } catch (error) {
      console.error(`Error getting random drink image: ${error.message}`);
      return null;
    }
  }
};

export default cloudinaryUploader;