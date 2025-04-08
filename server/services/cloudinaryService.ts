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
   * Get a background image URL based on alcohol category and subcategory
   */
  getBackgroundImageUrl(alcoholCategory: string, alcoholSubCategory?: string): string {
    const subCategory = alcoholSubCategory || 'default';
    const formattedCategory = alcoholCategory.toLowerCase().replace(/\s+/g, '_');
    const formattedSubCategory = subCategory.toLowerCase().replace(/\s+/g, '_');
    
    return cloudinary.url(`backgrounds/${formattedCategory}/${formattedSubCategory}`, {
      secure: true,
      transformation: [
        { width: 800, height: 400, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      default_image: 'backgrounds/default/default'
    });
  }
  
  /**
   * Get a brand image URL based on alcohol category and brand name
   */
  getBrandImageUrl(alcoholCategory: string, brandName: string): string {
    const formattedCategory = alcoholCategory.toLowerCase().replace(/\s+/g, '_');
    const formattedBrand = brandName.toLowerCase().replace(/\s+/g, '_');
    
    return cloudinary.url(`brands/${formattedCategory}/${formattedBrand}`, {
      secure: true,
      transformation: [
        { width: 200, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      default_image: `brands/${formattedCategory}/default`
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