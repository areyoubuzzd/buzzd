/**
 * Utilities for managing drink images with consistent categorization and naming
 * This module provides functions for organizing and retrieving images based on drink type
 */

// Define standard image categories
export type DrinkCategory = 
  // Beer categories
  | 'beer_pint' 
  | 'beer_bucket' 
  | 'beer_1for1' 
  | 'beer_freeflow'
  | 'beer_pitcher'
  | 'beer_tower'
  // Wine categories
  | 'wine_red_glass'
  | 'wine_white_glass'
  | 'wine_bubbly_glass'
  | 'wine_prosecco_glass'
  | 'wine_sake_glass'
  | 'wine_soju_glass'
  | 'wine_red_1for1'
  | 'wine_white_1for1'
  | 'wine_bubbly_1for1'
  | 'wine_prosecco_1for1'
  | 'wine_red_freeflow'
  | 'wine_white_freeflow'
  | 'wine_bubbly_freeflow'
  | 'wine_prosecco_freeflow'
  // Cocktail categories
  | 'cocktail_margarita'
  | 'cocktail_martini'
  | 'cocktail_singapore_sling'
  | 'cocktail_espresso_martini'
  | 'cocktail_cosmopolitan'
  | 'cocktail_highball'
  | 'cocktail_gin_tonic'
  // Spirit glass categories
  | 'spirit_whisky_glass'
  | 'spirit_vodka_glass'
  | 'spirit_rum_glass'
  // Spirit bottle categories
  | 'spirit_whisky_bottle'
  | 'spirit_vodka_bottle'
  | 'spirit_rum_bottle'
  | 'spirit_tequila_bottle'
  | 'spirit_gin_bottle'
  // Fallback
  | 'unknown';

// Map simplified categories to detailed categories
export function mapToDrinkCategory(drinkName: string, baseCategory?: string): DrinkCategory {
  const lowerName = drinkName.toLowerCase();
  
  // Beer categories
  if ((baseCategory?.includes('beer') || lowerName.includes('beer') || 
       lowerName.includes('pint') || lowerName.includes('draught')) && 
      !lowerName.includes('bucket') && !lowerName.includes('pitcher') && 
      !lowerName.includes('tower') && !lowerName.includes('free flow') && 
      !lowerName.includes('1-for-1') && !lowerName.includes('1 for 1')) {
    return 'beer_pint';
  }
  
  if ((baseCategory?.includes('beer') || lowerName.includes('beer')) && 
      lowerName.includes('bucket')) {
    return 'beer_bucket';
  }
  
  if ((baseCategory?.includes('beer') || lowerName.includes('beer')) && 
      (lowerName.includes('1-for-1') || lowerName.includes('1 for 1'))) {
    return 'beer_1for1';
  }
  
  if ((baseCategory?.includes('beer') || lowerName.includes('beer')) && 
      (lowerName.includes('free flow') || lowerName.includes('freeflow'))) {
    return 'beer_freeflow';
  }
  
  if ((baseCategory?.includes('beer') || lowerName.includes('beer')) && 
      lowerName.includes('pitcher')) {
    return 'beer_pitcher';
  }
  
  if ((baseCategory?.includes('beer') || lowerName.includes('beer')) && 
      lowerName.includes('tower')) {
    return 'beer_tower';
  }
  
  // Wine categories
  if ((baseCategory?.includes('wine') || lowerName.includes('wine')) && 
      lowerName.includes('red') && !lowerName.includes('bottle') && 
      !lowerName.includes('1-for-1') && !lowerName.includes('1 for 1') && 
      !lowerName.includes('free flow') && !lowerName.includes('freeflow')) {
    return 'wine_red_glass';
  }
  
  if ((baseCategory?.includes('wine') || lowerName.includes('wine')) && 
      lowerName.includes('white') && !lowerName.includes('bottle') && 
      !lowerName.includes('1-for-1') && !lowerName.includes('1 for 1') && 
      !lowerName.includes('free flow') && !lowerName.includes('freeflow')) {
    return 'wine_white_glass';
  }
  
  if ((lowerName.includes('bubbly') || lowerName.includes('champagne')) && 
      !lowerName.includes('bottle') && !lowerName.includes('1-for-1') && 
      !lowerName.includes('1 for 1') && !lowerName.includes('free flow') && 
      !lowerName.includes('freeflow')) {
    return 'wine_bubbly_glass';
  }
  
  if (lowerName.includes('prosecco') && !lowerName.includes('bottle') && 
      !lowerName.includes('1-for-1') && !lowerName.includes('1 for 1') && 
      !lowerName.includes('free flow') && !lowerName.includes('freeflow')) {
    return 'wine_prosecco_glass';
  }
  
  if (lowerName.includes('sake') && !lowerName.includes('bottle')) {
    return 'wine_sake_glass';
  }
  
  if (lowerName.includes('soju') && !lowerName.includes('bottle')) {
    return 'wine_soju_glass';
  }
  
  // 1-for-1 wine deals
  if ((baseCategory?.includes('wine') || lowerName.includes('wine')) && 
      lowerName.includes('red') && (lowerName.includes('1-for-1') || 
      lowerName.includes('1 for 1'))) {
    return 'wine_red_1for1';
  }
  
  if ((baseCategory?.includes('wine') || lowerName.includes('wine')) && 
      lowerName.includes('white') && (lowerName.includes('1-for-1') || 
      lowerName.includes('1 for 1'))) {
    return 'wine_white_1for1';
  }
  
  // Free flow wine deals
  if ((baseCategory?.includes('wine') || lowerName.includes('wine')) && 
      lowerName.includes('red') && (lowerName.includes('free flow') || 
      lowerName.includes('freeflow'))) {
    return 'wine_red_freeflow';
  }
  
  if ((baseCategory?.includes('wine') || lowerName.includes('wine')) && 
      lowerName.includes('white') && (lowerName.includes('free flow') || 
      lowerName.includes('freeflow'))) {
    return 'wine_white_freeflow';
  }
  
  // Cocktail categories
  if (lowerName.includes('margarita')) {
    return 'cocktail_margarita';
  }
  
  if (lowerName.includes('martini') && !lowerName.includes('espresso')) {
    return 'cocktail_martini';
  }
  
  if (lowerName.includes('espresso martini') || lowerName.includes('espresso-martini')) {
    return 'cocktail_espresso_martini';
  }
  
  if (lowerName.includes('singapore sling') || lowerName.includes('singapore-sling')) {
    return 'cocktail_singapore_sling';
  }
  
  if (lowerName.includes('cosmopolitan')) {
    return 'cocktail_cosmopolitan';
  }
  
  if (lowerName.includes('highball')) {
    return 'cocktail_highball';
  }
  
  if (lowerName.includes('gin') && lowerName.includes('tonic')) {
    return 'cocktail_gin_tonic';
  }
  
  // Spirit glasses
  if (lowerName.includes('whisky') || lowerName.includes('whiskey') || 
      lowerName.includes('bourbon') || lowerName.includes('scotch')) {
    if (!lowerName.includes('bottle')) {
      return 'spirit_whisky_glass';
    } else {
      return 'spirit_whisky_bottle';
    }
  }
  
  if (lowerName.includes('vodka')) {
    if (!lowerName.includes('bottle')) {
      return 'spirit_vodka_glass';
    } else {
      return 'spirit_vodka_bottle';
    }
  }
  
  if (lowerName.includes('rum')) {
    if (!lowerName.includes('bottle')) {
      return 'spirit_rum_glass';
    } else {
      return 'spirit_rum_bottle';
    }
  }
  
  if (lowerName.includes('tequila') && lowerName.includes('bottle')) {
    return 'spirit_tequila_bottle';
  }
  
  if (lowerName.includes('gin') && lowerName.includes('bottle')) {
    return 'spirit_gin_bottle';
  }
  
  // Default fallback based on basic category
  if (baseCategory?.includes('beer')) {
    return 'beer_pint';
  }
  
  if (baseCategory?.includes('wine')) {
    return 'wine_red_glass';
  }
  
  if (baseCategory?.includes('cocktail')) {
    return 'cocktail_martini';
  }
  
  if (baseCategory?.includes('whisky') || baseCategory?.includes('whiskey')) {
    return 'spirit_whisky_glass';
  }
  
  if (baseCategory?.includes('vodka')) {
    return 'spirit_vodka_glass';
  }
  
  if (baseCategory?.includes('rum')) {
    return 'spirit_rum_glass';
  }
  
  if (baseCategory?.includes('gin')) {
    return 'spirit_gin_bottle';
  }
  
  // Complete fallback
  return 'unknown';
}

// Get a consistent color for each drink category
export function getDrinkCategoryColor(category?: DrinkCategory | string): string {
  if (!category) return '#6b7280'; // Gray default
  
  const categoryStr = String(category).toLowerCase();
  
  // Beer colors (amber/golden)
  if (categoryStr.includes('beer')) {
    return '#f59e0b';
  }
  
  // Wine colors
  if (categoryStr.includes('wine_red')) {
    return '#7f1d1d';
  }
  
  if (categoryStr.includes('wine_white')) {
    return '#fef3c7';
  }
  
  if (categoryStr.includes('wine_bubbly') || categoryStr.includes('wine_prosecco')) {
    return '#fef9c3';
  }
  
  if (categoryStr.includes('wine_sake') || categoryStr.includes('wine_soju')) {
    return '#e5e7eb';
  }
  
  // Cocktail colors
  if (categoryStr.includes('cocktail_margarita')) {
    return '#65a30d';
  }
  
  if (categoryStr.includes('cocktail_martini')) {
    return '#f3f4f6';
  }
  
  if (categoryStr.includes('cocktail_espresso')) {
    return '#44403c';
  }
  
  if (categoryStr.includes('cocktail_singapore')) {
    return '#ef4444';
  }
  
  if (categoryStr.includes('cocktail_cosmopolitan')) {
    return '#be185d';
  }
  
  if (categoryStr.includes('cocktail')) {
    return '#db2777';
  }
  
  // Spirit colors
  if (categoryStr.includes('whisky') || categoryStr.includes('bourbon') || categoryStr.includes('scotch')) {
    return '#92400e';
  }
  
  if (categoryStr.includes('vodka')) {
    return '#f3f4f6';
  }
  
  if (categoryStr.includes('rum')) {
    return '#78350f';
  }
  
  if (categoryStr.includes('tequila')) {
    return '#fcd34d';
  }
  
  if (categoryStr.includes('gin')) {
    return '#bfdbfe';
  }
  
  // Default fallback
  return '#6b7280';
}

// Client-side caching of image IDs to reduce API calls
const IMAGE_CACHE_KEY = 'cloudflare_image_cache';
interface ImageCacheEntry {
  category: DrinkCategory;
  timestamp: number;
  imageId: string;
}

// Store image IDs in local storage with category metadata
export function cacheImageId(imageId: string, category: DrinkCategory): void {
  try {
    const cacheData = localStorage.getItem(IMAGE_CACHE_KEY);
    const cache: Record<string, ImageCacheEntry> = cacheData ? JSON.parse(cacheData) : {};
    
    cache[category] = {
      category,
      timestamp: Date.now(),
      imageId
    };
    
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to cache image ID:', error);
  }
}

// Retrieve cached image ID by category
export function getCachedImageId(category: DrinkCategory): string | null {
  try {
    const cacheData = localStorage.getItem(IMAGE_CACHE_KEY);
    if (!cacheData) return null;
    
    const cache: Record<string, ImageCacheEntry> = JSON.parse(cacheData);
    const entry = cache[category];
    
    if (!entry) return null;
    
    // Check if cache is fresh (less than 24 hours)
    const isFresh = Date.now() - entry.timestamp < 24 * 60 * 60 * 1000;
    return isFresh ? entry.imageId : null;
  } catch (error) {
    console.warn('Failed to retrieve cached image ID:', error);
    return null;
  }
}

// Format a custom ID for Cloudflare based on category
export function formatCloudflareCustomId(category: DrinkCategory, variant: number = 1): string {
  return `${category.replace(/_/g, '/')}/${variant}`;
}