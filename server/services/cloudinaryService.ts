import { v2 as cloudinary } from 'cloudinary';

// Try to configure Cloudinary from environment variables
// Fall back to demo account if environment variables not set or invalid
try {
  const cloudConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    api_key: process.env.CLOUDINARY_API_KEY || 'demo_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'demo_secret'
  };
  
  // Log the actual configuration we're using (without showing secrets)
  console.log('Cloudinary configuration:', {
    cloud_name: cloudConfig.cloud_name,
    api_key_exists: !!cloudConfig.api_key,
    api_secret_exists: !!cloudConfig.api_secret
  });
  
  cloudinary.config(cloudConfig);
} catch (error) {
  console.error('Error configuring Cloudinary:', error);
  // Fall back to demo account
  cloudinary.config({
    cloud_name: 'demo',
    api_key: 'demo_key',
    api_secret: 'demo_secret'
  });
}

class CloudinaryService {
  private useDemoAccount: boolean;
  private cloudName: string;
  
  constructor() {
    // Check if we have the necessary environment variables
    this.useDemoAccount = !process.env.CLOUDINARY_CLOUD_NAME || 
                         !process.env.CLOUDINARY_API_KEY || 
                         !process.env.CLOUDINARY_API_SECRET;
    
    // Store cloud name for direct URL building
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'demo';
    
    if (this.useDemoAccount) {
      console.warn('Cloudinary credentials not found or invalid - using demo account');
    }
  }
  
  /**
   * Get direct URL to demo Cloudinary account for fallback
   */
  getFallbackDemoUrl(path: string, format: 'jpg'|'png'|'auto' = 'auto'): string {
    // Always use the demo account for fallback URLs
    const formatSuffix = format === 'auto' ? '' : `.${format}`;
    
    // Check if path already has an extension
    if (path.includes('.jpg') || path.includes('.jpeg') || path.includes('.png')) {
      // Path already has extension, don't modify it
      return `https://res.cloudinary.com/demo/image/upload/${path}`;
    }
    
    // Add proper format suffix
    return `https://res.cloudinary.com/demo/image/upload/${path}${formatSuffix}`;
  }
  
  /**
   * Get a background image URL based on alcohol category
   * Note: Background images are not divided by bottle/glass as they are just general category backgrounds
   */
  getBackgroundImageUrl(alcoholCategory: string, alcoholSubCategory?: string, servingStyle?: 'bottle' | 'glass'): string {
    const formattedCategory = alcoholCategory.toLowerCase().replace(/\s+/g, '_');
    
    try {
      // If we're using the demo account due to missing credentials, use direct URL method
      if (this.useDemoAccount) {
        return this.getFallbackDemoUrl(`backgrounds/${formattedCategory}/image`, 'png');
      }
      
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
    } catch (error) {
      console.error('Error getting background image URL:', error);
      // If anything fails, return a demo URL
      return this.getFallbackDemoUrl('sample');
    }
  }
  
  /**
   * Get a brand image URL based on alcohol category, brand name, and serving style (bottle/glass)
   * For cocktails, the brandName is treated as the cocktail name (e.g., "margarita", "mojito")
   */
  getBrandImageUrl(alcoholCategory: string, brandName: string, servingStyle?: 'bottle' | 'glass'): string {
    try {
      const formattedCategory = alcoholCategory.toLowerCase().replace(/\s+/g, '_');
      const formattedBrand = brandName.toLowerCase().replace(/\s+/g, '_');
      const serving = servingStyle?.toLowerCase() || 'default';
      
      // If we're using the demo account due to missing credentials, use direct URL method
      if (this.useDemoAccount) {
        // Special handling for cocktails
        if (formattedCategory === 'cocktail') {
          return this.getFallbackDemoUrl(`brands/cocktail/${formattedBrand}/glass`, 'png');
        }
        return this.getFallbackDemoUrl(`brands/${formattedCategory}/${formattedBrand}/${serving}`, 'png');
      }
      
      // Special handling for cocktails - they are typically served in glasses
      if (formattedCategory === 'cocktail') {
        // For cocktails, we always use 'glass' as the serving style (override any provided value)
        const cocktailServing = 'glass';
        
        // Path structure for cocktails: brands/cocktail/[cocktail_name]/glass
        return cloudinary.url(`brands/${formattedCategory}/${formattedBrand}/${cocktailServing}`, {
          secure: true,
          transformation: [
            { width: 200, crop: 'fill' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ],
          // Fallback to a generic cocktail glass if the specific cocktail image doesn't exist
          default_image: `brands/${formattedCategory}/${cocktailServing}/default`
        });
      }
      
      // Path structure: brands/[category]/[brand]/[bottle_or_glass]
      return cloudinary.url(`brands/${formattedCategory}/${formattedBrand}/${serving}`, {
        secure: true,
        transformation: [
          { width: 200, crop: 'fill' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ],
        // Fallback to category/serving/default if brand specific image doesn't exist
        default_image: `brands/${formattedCategory}/${serving}/default`
      });
    } catch (error) {
      console.error('Error getting brand image URL:', error);
      // If anything fails, return a demo URL
      return this.getFallbackDemoUrl('bottle');
    }
  }
  
  /**
   * Get a restaurant logo URL
   */
  getRestaurantLogoUrl(restaurantId: string, logoUrl?: string): string {
    try {
      // If a logo URL is provided and it's already a Cloudinary URL, return it as-is
      if (logoUrl && logoUrl.includes('cloudinary.com')) {
        return logoUrl;
      }
      
      // If provided a non-Cloudinary URL, we could upload it here in a future version
      // But for now we'll just find it by ID
      
      // If we're using the demo account due to missing credentials, use direct URL method
      if (this.useDemoAccount) {
        return this.getFallbackDemoUrl(`restaurants/logos/${restaurantId}`, 'png');
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
    } catch (error) {
      console.error('Error getting restaurant logo URL:', error);
      // If anything fails, return a demo URL
      return this.getFallbackDemoUrl('restaurants/logos/default');
    }
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