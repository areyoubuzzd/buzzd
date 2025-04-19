/**
 * Utility functions for image categories and drink types
 */

// Drink categories for our application
export enum DrinkCategory {
  // Beer categories
  BEER_PINT = 'beer_pint',
  BEER_BUCKET = 'beer_bucket',
  BEER_TOWER = 'beer_tower',
  BEER_BOTTLE = 'beer_bottle',
  BEER_CRAFT = 'beer_craft',
  
  // Wine categories
  WINE_RED = 'wine_red',
  WINE_WHITE = 'wine_white',
  WINE_ROSE = 'wine_rose',
  WINE_SPARKLING = 'wine_sparkling',
  WINE_BOTTLE = 'wine_bottle',
  
  // Cocktail categories
  COCKTAIL_MARGARITA = 'cocktail_margarita',
  COCKTAIL_MOJITO = 'cocktail_mojito',
  COCKTAIL_MARTINI = 'cocktail_martini',
  COCKTAIL_NEGRONI = 'cocktail_negroni',
  COCKTAIL_OLDLNG_FASHIONED = 'cocktail_old_fashioned',
  COCKTAIL_LONGISLAND = 'cocktail_long_island',
  
  // Spirit categories
  SPIRIT_WHISKY = 'spirit_whisky',
  SPIRIT_VODKA = 'spirit_vodka',
  SPIRIT_RUM = 'spirit_rum',
  SPIRIT_GIN = 'spirit_gin',
  SPIRIT_TEQUILA = 'spirit_tequila',
  
  // General categories
  GENERAL = 'general',
  FOOD = 'food',
  DESSERT = 'dessert',
}

// Color mapping for drink categories
const CATEGORY_COLORS: Record<string, string> = {
  // Beer colors
  beer: '#F59E0B', // Amber
  beer_pint: '#F59E0B',
  beer_bucket: '#D97706',
  beer_tower: '#B45309',
  beer_bottle: '#92400E',
  beer_craft: '#78350F',
  
  // Wine colors
  wine: '#BE123C', // Ruby red
  wine_red: '#BE123C',
  wine_white: '#FCD34D',
  wine_rose: '#FB7185',
  wine_sparkling: '#F43F5E',
  wine_bottle: '#9F1239',
  
  // Cocktail colors
  cocktail: '#DB2777', // Pink
  cocktail_margarita: '#EC4899',
  cocktail_mojito: '#14B8A6',
  cocktail_martini: '#A21CAF',
  cocktail_negroni: '#E11D48',
  cocktail_old_fashioned: '#B45309',
  cocktail_long_island: '#6D28D9',
  
  // Spirit colors
  spirit: '#8B5CF6', // Purple
  spirit_whisky: '#A16207',
  spirit_vodka: '#94A3B8',
  spirit_rum: '#B45309',
  spirit_gin: '#0369A1',
  spirit_tequila: '#F59E0B',
  
  // General colors
  general: '#6B7280', // Gray
  food: '#65A30D',    // Green
  dessert: '#D946EF', // Purple-pink
};

// Default category colors by main type
export const DEFAULT_CATEGORY_COLORS = {
  beer: '#F59E0B',
  wine: '#BE123C',
  cocktail: '#DB2777',
  spirit: '#8B5CF6',
  food: '#65A30D',
  dessert: '#D946EF',
  general: '#6B7280',
};

/**
 * Get the appropriate color for a drink category
 */
export function getDrinkCategoryColor(category?: string): string {
  if (!category) return DEFAULT_CATEGORY_COLORS.general;
  
  // First try exact match
  if (category in CATEGORY_COLORS) {
    return CATEGORY_COLORS[category];
  }
  
  // Try matching main category
  const mainCategory = category.split('_')[0];
  if (mainCategory in DEFAULT_CATEGORY_COLORS) {
    return DEFAULT_CATEGORY_COLORS[mainCategory as keyof typeof DEFAULT_CATEGORY_COLORS];
  }
  
  // Default fallback
  return DEFAULT_CATEGORY_COLORS.general;
}

/**
 * Get the main category from a full category string
 */
export function getMainCategory(category?: string): string {
  if (!category) return 'general';
  
  const parts = category.split('_');
  return parts[0] || 'general';
}

/**
 * Convert a drink name to a likely category
 */
export function guessCategoryFromDrinkName(drinkName?: string): string {
  if (!drinkName) return 'general';
  
  const nameLower = drinkName.toLowerCase();
  
  // Beer detection
  if (/beer|lager|pint|draft|draught|ale|ipa|stout|porter|pilsner|hefeweizen/i.test(nameLower)) {
    if (/bucket|tower/i.test(nameLower)) {
      return nameLower.includes('bucket') ? 'beer_bucket' : 'beer_tower';
    }
    if (/bottle/i.test(nameLower)) return 'beer_bottle';
    if (/craft|ipa|ale/i.test(nameLower)) return 'beer_craft';
    return 'beer_pint';
  }
  
  // Wine detection
  if (/wine|vino|merlot|cabernet|sauvignon|chardonnay|pinot|riesling/i.test(nameLower)) {
    if (/red/i.test(nameLower)) return 'wine_red';
    if (/white/i.test(nameLower)) return 'wine_white';
    if (/rose|rosé/i.test(nameLower)) return 'wine_rose';
    if (/sparkl|champagne|prosecco|bubbly/i.test(nameLower)) return 'wine_sparkling';
    if (/bottle/i.test(nameLower)) return 'wine_bottle';
    return 'wine';
  }
  
  // Cocktail detection
  if (/cocktail|mixed|drink/i.test(nameLower)) {
    if (/margarita/i.test(nameLower)) return 'cocktail_margarita';
    if (/mojito/i.test(nameLower)) return 'cocktail_mojito';
    if (/martini/i.test(nameLower)) return 'cocktail_martini';
    if (/negroni/i.test(nameLower)) return 'cocktail_negroni';
    if (/old.?fashion/i.test(nameLower)) return 'cocktail_old_fashioned';
    if (/long.?island/i.test(nameLower)) return 'cocktail_long_island';
    return 'cocktail';
  }
  
  // Spirit detection
  if (/whisky|whiskey|bourbon|scotch/i.test(nameLower)) return 'spirit_whisky';
  if (/vodka/i.test(nameLower)) return 'spirit_vodka';
  if (/rum/i.test(nameLower)) return 'spirit_rum';
  if (/gin/i.test(nameLower)) return 'spirit_gin';
  if (/tequila|mezcal/i.test(nameLower)) return 'spirit_tequila';
  
  // Food detection
  if (/burger|pizza|pasta|nachos|fries|wings|snack|appetizer|food/i.test(nameLower)) return 'food';
  
  // Dessert detection
  if (/dessert|cake|ice.?cream|brownie|sweet/i.test(nameLower)) return 'dessert';
  
  // Default fallback
  return 'general';
}

// Cache for storing image IDs by category locally in the browser
const IMAGE_ID_CACHE: Record<string, string[]> = {};

/**
 * Add an image ID to the local cache
 */
export function cacheImageId(category: string, imageId: string): void {
  if (!IMAGE_ID_CACHE[category]) {
    IMAGE_ID_CACHE[category] = [];
  }
  
  // Don't add duplicates
  if (!IMAGE_ID_CACHE[category].includes(imageId)) {
    IMAGE_ID_CACHE[category].push(imageId);
  }
}

/**
 * Get a random image ID from the cache for a category
 */
export function getRandomImageIdFromCache(category: string): string | null {
  const ids = IMAGE_ID_CACHE[category];
  if (!ids || ids.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * ids.length);
  return ids[randomIndex];
}

/**
 * Format a custom ID for Cloudflare Images
 * This helps with organization and categorization
 */
export function formatCloudflareCustomId(
  category: string, 
  drinkName?: string
): string {
  const safeDrinkName = drinkName 
    ? drinkName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    : '';
    
  const timestamp = Date.now();
  
  return `${category}${safeDrinkName ? '_' + safeDrinkName : ''}_${timestamp}`;
}

/**
 * Map a string to a DrinkCategory enum
 */
export function mapToDrinkCategory(category: string): DrinkCategory {
  // Try to match directly
  if (Object.values(DrinkCategory).includes(category as DrinkCategory)) {
    return category as DrinkCategory;
  }
  
  // Try to find a close match
  const mainCategory = category.split('_')[0];
  
  switch (mainCategory) {
    case 'beer':
      return DrinkCategory.BEER_PINT;
    case 'wine':
      return DrinkCategory.WINE_RED;
    case 'cocktail':
      return DrinkCategory.COCKTAIL_MARTINI;
    case 'spirit':
      return DrinkCategory.SPIRIT_WHISKY;
    case 'food':
      return DrinkCategory.FOOD;
    case 'dessert':
      return DrinkCategory.DESSERT;
    default:
      return DrinkCategory.GENERAL;
  }
}

/**
 * Format a URL for serving local images
 */
export function getLocalImageUrl(
  category: string,
  imageId: string,
  options?: { width?: number; height?: number }
): string {
  // Make sure imageId has an extension
  const fileExtension = imageId.includes('.') ? '' : '.jpeg';
  
  // Build URL parameters if needed
  const params: string[] = [];
  if (options?.width) params.push(`width=${options.width}`);
  if (options?.height) params.push(`height=${options.height}`);
  
  const queryString = params.length > 0 ? `?${params.join('&')}` : '';
  
  // Use the direct image route for reliable serving
  return `/direct-image/${category}/${imageId}${fileExtension}${queryString}`;
}