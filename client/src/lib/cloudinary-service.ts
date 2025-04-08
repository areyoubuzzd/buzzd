/**
 * Client-side utility for working with Cloudinary URLs
 */

// Use the same cloud name as server side
const CLOUDINARY_CLOUD_NAME = 'dp2uoj3ts';
const BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

class CloudinaryService {
  /**
   * Get a URL for a background image based on the drink category
   */
  getBackgroundImageUrl(category: string): string {
    const normalizedCategory = this.normalizeString(category);
    return `${BASE_URL}/home/backgrounds/${normalizedCategory}/card_bg.png`;
  }

  /**
   * Get a URL for a drink hero image based on category, brand, and serving style
   */
  getHeroImageUrl(
    category: string,
    brand?: string, 
    servingStyle: 'bottle' | 'glass' = 'glass'
  ): string {
    const normalizedCategory = this.normalizeString(category);
    
    if (brand) {
      const normalizedBrand = this.normalizeString(brand);
      return `${BASE_URL}/home/brands/${normalizedCategory}/${normalizedBrand}/${servingStyle}/drink.png`;
    }
    
    // Default image for this category if no brand is specified
    return `${BASE_URL}/home/brands/${normalizedCategory}/${servingStyle}/default/default.png`;
  }

  /**
   * Helper method to normalize strings for URL path components
   */
  private normalizeString(str: string): string {
    if (!str) return 'default';
    return str.toLowerCase().trim().replace(/\s+/g, '_');
  }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();