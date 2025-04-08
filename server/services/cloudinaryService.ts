import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
  constructor() {
    // Check if we have the necessary environment variables
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary credentials not found in environment variables');
    }
  }
  
  /**
   * Get a background image URL based on alcohol category
   * Note: Background images are not divided by bottle/glass as they are just general category backgrounds
   */
  getBackgroundImageUrl(alcoholCategory: string, alcoholSubCategory?: string, servingStyle?: 'bottle' | 'glass'): string {
    const formattedCategory = alcoholCategory.toLowerCase().replace(/\s+/g, '_');
    
    // Simplified path structure: backgrounds/[category]/image
    return cloudinary.url(`backgrounds/${formattedCategory}/image`, {
      secure: true,
      transformation: [
        { width: 800, height: 400, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      // Fallback to default background if category-specific one doesn't exist
      default_image: 'backgrounds/default/image'
    });
  }
  
  /**
   * Get a brand image URL based on alcohol category, brand name, and serving style (bottle/glass)
   * For cocktails, the brandName is treated as the cocktail name (e.g., "margarita", "mojito")
   */
  getBrandImageUrl(alcoholCategory: string, brandName: string, servingStyle?: 'bottle' | 'glass'): string {
    const formattedCategory = alcoholCategory.toLowerCase().replace(/\s+/g, '_');
    const formattedBrand = brandName.toLowerCase().replace(/\s+/g, '_');
    
    // Special handling for cocktails - they are typically served in glasses
    if (formattedCategory === 'cocktail') {
      // For cocktails, we always use 'glass' as the serving style (override any provided value)
      const serving = 'glass';
      
      // Path structure for cocktails: brands/cocktail/[cocktail_name]/glass
      return cloudinary.url(`brands/${formattedCategory}/${formattedBrand}/${serving}`, {
        secure: true,
        transformation: [
          { width: 200, crop: 'fill' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ],
        // Fallback to a generic cocktail glass if the specific cocktail image doesn't exist
        default_image: `brands/${formattedCategory}/${serving}/default`
      });
    }
    
    // Standard handling for other alcohol types (beer, wine, whisky, etc.)
    const serving = servingStyle || 'default';
    
    // Path structure: brands/[category]/[brand]/[bottle_or_glass]
    return cloudinary.url(`brands/${formattedCategory}/${formattedBrand}/${serving}`, {
      secure: true,
      transformation: [
        { width: 200, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      // Fallback to category/bottle/default if brand specific image doesn't exist
      default_image: `brands/${formattedCategory}/${serving}/default`
    });
  }
  
  /**
   * Get a restaurant logo URL
   */
  getRestaurantLogoUrl(restaurantId: string, logoUrl?: string): string {
    if (logoUrl && logoUrl.includes('cloudinary.com')) {
      return logoUrl; // Return as-is if it's already a Cloudinary URL
    }
    
    // Use the restaurant ID to fetch the logo from Cloudinary
    return cloudinary.url(`restaurants/logos/${restaurantId}`, {
      secure: true,
      transformation: [
        { width: 150, height: 150, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      default_image: 'restaurants/logos/default'
    });
  }
  
  /**
   * Upload an image to Cloudinary
   */
  async uploadImage(file: any, folder: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        file,
        { folder: folder },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  }
}

// Create and export a singleton instance
export const cloudinaryService = new CloudinaryService();