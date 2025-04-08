/**
 * Utility functions for working with Cloudinary images specifically for drink cards
 */

// Base Cloudinary URL for the project - should match the server config
const CLOUDINARY_CLOUD_NAME = 'dp2uoj3ts';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Path constants
const BACKGROUND_PATH = 'home/backgrounds';
const HERO_PATH = 'home/brands';

/**
 * Gets the URL for a background image based on the drink category
 * @param category The drink category (beer, wine, cocktail, etc.)
 * @returns URL for the background image
 */
export function getBackgroundImageUrl(category: string): string {
  // Convert category to lowercase and normalize
  const normalizedCategory = normalizeString(category);
  
  // Create the path with transformations for background images
  // Use the wildcard (*) to get any image in that folder
  const backgroundUrl = `${CLOUDINARY_BASE_URL}/c_fill,w_800,h_400,q_auto/${BACKGROUND_PATH}/${normalizedCategory}/*`;
  
  return backgroundUrl;
}

/**
 * Gets the URL for a hero image based on the drink category, brand, and serving style
 * @param category The drink category (beer, wine, cocktail, etc.)
 * @param brandName Optional brand name
 * @param servingStyle Optional serving style (bottle or glass)
 * @returns URL for the hero image
 */
export function getHeroImageUrl(
  category: string, 
  brandName?: string, 
  servingStyle: 'bottle' | 'glass' = 'glass'
): string {
  // Convert values to lowercase and normalize
  const normalizedCategory = normalizeString(category);
  
  let path: string;
  
  if (brandName) {
    // If we have a brand name, use the specific brand folder
    const normalizedBrand = normalizeString(brandName);
    path = `${HERO_PATH}/${normalizedCategory}/${normalizedBrand}/*`;
  } else {
    // No brand, use default for that category and serving style
    path = `${HERO_PATH}/${normalizedCategory}/${servingStyle}/default/*`;
  }
  
  // Create the URL with transformations for hero images
  const heroUrl = `${CLOUDINARY_BASE_URL}/c_fill,w_400,h_400,q_auto/${path}`;
  
  return heroUrl;
}

/**
 * Normalizes a string for use in URLs
 * @param str The string to normalize
 * @returns Normalized string
 */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, '_');
}