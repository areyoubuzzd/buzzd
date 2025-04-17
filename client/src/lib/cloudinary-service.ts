/**
 * Client-side utility for working with Cloudinary URLs
 */

// Use the same cloud name as server side
const CLOUDINARY_CLOUD_NAME = 'dp2uoj3ts';
const BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const API_BASE_URL = '/api/cloudinary';

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
   * Get a random image for a specific drink from the Cloudinary API
   * This fetches from our custom endpoint that returns a random image from a folder
   */
  async getRandomDrinkImageUrl(
    category: string,
    drinkName: string,
    servingStyle: 'bottle' | 'glass' = 'glass'
  ): Promise<string | null> {
    try {
      // Build the URL with query parameters
      const queryParams = new URLSearchParams({
        category: this.normalizeString(category),
        drinkName: this.normalizeString(drinkName),
        servingStyle
      });

      // Make the API request to our backend endpoint
      const response = await fetch(`${API_BASE_URL}/random-drink-image?${queryParams.toString()}`);
      
      if (!response.ok) {
        console.warn(`Failed to get random image for ${drinkName}:`, response.status);
        // Fall back to the static URL if the random API fails
        return this.getHeroImageUrl(category, drinkName, servingStyle);
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error fetching random drink image:', error);
      // Fall back to the static URL method if there's an error
      return this.getHeroImageUrl(category, drinkName, servingStyle);
    }
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