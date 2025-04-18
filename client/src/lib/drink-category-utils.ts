/**
 * Utility functions for mapping drink names and categories to more specific types
 * for Cloudflare Images and other display purposes
 */

/**
 * Beer-related categories and subcategories mapping
 */
const beerCategories = {
  default: 'beer_pint',
  pint: 'beer_pint',
  bucket: 'beer_bucket',
  tower: 'beer_tower',
  pitcher: 'beer_pitcher',
  'one-for-one': '1-for-1_beer',
  '1-for-1': '1-for-1_beer',
  'free flow': 'freeflow_beer',
  freeflow: 'freeflow_beer',
};

/**
 * Wine-related categories and subcategories mapping
 */
const wineCategories = {
  default: 'red_wine_glass',
  red: 'red_wine_glass',
  white: 'white_wine_glass',
  bubbly: 'bubbly_glass',
  champagne: 'bubbly_glass',
  prosecco: 'prosecco_glass',
  sake: 'sake_glass',
  soju: 'soju_glass',
  'one-for-one red': '1-for-1_red_wine',
  'one-for-one white': '1-for-1_white_wine',
  'one-for-one bubbly': '1-for-1_bubbly',
  'one-for-one prosecco': '1-for-1_prosecco',
  '1-for-1 red': '1-for-1_red_wine',
  '1-for-1 white': '1-for-1_white_wine',
  '1-for-1 bubbly': '1-for-1_bubbly',
  '1-for-1 prosecco': '1-for-1_prosecco',
  'free flow red': 'freeflow_red_wine',
  'free flow white': 'freeflow_white_wine',
  'free flow bubbly': 'freeflow_bubbly',
  'free flow prosecco': 'freeflow_prosecco',
  'freeflow red': 'freeflow_red_wine',
  'freeflow white': 'freeflow_white_wine',
  'freeflow bubbly': 'freeflow_bubbly',
  'freeflow prosecco': 'freeflow_prosecco',
};

/**
 * Cocktail-related categories mapping
 */
const cocktailCategories = {
  default: 'cocktail',
  margarita: 'margarita',
  martini: 'martini',
  'espresso martini': 'espresso_martini',
  'singapore sling': 'singapore_sling',
  cosmopolitan: 'cosmopolitan',
  highball: 'highball',
  'gin tonic': 'gin_tonic',
};

/**
 * Spirits-related categories mapping
 */
const spiritsCategories = {
  default: 'whisky_glass',
  // Glasses
  'whisky glass': 'whisky_glass',
  'vodka glass': 'vodka_glass',
  'rum glass': 'rum_glass',
  // Bottles
  'whisky bottle': 'whisky_bottle',
  'vodka bottle': 'vodka_bottle',
  'rum bottle': 'rum_bottle',
  'tequila bottle': 'tequila_bottle',
  'gin bottle': 'gin_bottle',
};

/**
 * Maps a drink name and alcohol category to a more specific category
 * for Cloudflare Images and other display purposes
 * 
 * @param drinkName The name of the drink
 * @param alcoholCategory The general alcohol category
 * @returns A specific drink category for better image categorization
 */
export function mapToDrinkCategory(drinkName: string | null | undefined, alcoholCategory: string | null | undefined): string {
  // Default to 'beer_pint' if no information is provided
  if (!drinkName && !alcoholCategory) return 'beer_pint';
  
  // Convert to lowercase for easier matching
  const drinkNameLower = (drinkName || '').toLowerCase();
  const categoryLower = (alcoholCategory || '').toLowerCase();
  
  // Start with checking the drink name for specific drink types
  if (drinkNameLower.includes('bucket') || drinkNameLower.includes('buckets')) {
    return 'beer_bucket';
  }
  
  if (drinkNameLower.includes('tower')) {
    return 'beer_tower';
  }
  
  if (drinkNameLower.includes('pitcher')) {
    return 'beer_pitcher';
  }
  
  // Check for 1-for-1 deals in the drink name
  if (drinkNameLower.includes('1-for-1') || drinkNameLower.includes('one for one')) {
    // Determine which type of 1-for-1 based on the category
    if (categoryLower.includes('beer')) {
      return '1-for-1_beer';
    }
    if (categoryLower.includes('wine')) {
      if (drinkNameLower.includes('red')) return '1-for-1_red_wine';
      if (drinkNameLower.includes('white')) return '1-for-1_white_wine';
      if (drinkNameLower.includes('bubbly') || drinkNameLower.includes('champagne')) return '1-for-1_bubbly';
      if (drinkNameLower.includes('prosecco')) return '1-for-1_prosecco';
      return '1-for-1_red_wine'; // Default to red wine for 1-for-1 wine deals
    }
  }
  
  // Check for free flow deals
  if (drinkNameLower.includes('free flow') || drinkNameLower.includes('freeflow')) {
    // Determine which type of free flow based on the category
    if (categoryLower.includes('beer')) {
      return 'freeflow_beer';
    }
    if (categoryLower.includes('wine')) {
      if (drinkNameLower.includes('red')) return 'freeflow_red_wine';
      if (drinkNameLower.includes('white')) return 'freeflow_white_wine';
      if (drinkNameLower.includes('bubbly') || drinkNameLower.includes('champagne')) return 'freeflow_bubbly';
      if (drinkNameLower.includes('prosecco')) return 'freeflow_prosecco';
      return 'freeflow_red_wine'; // Default to red wine for free flow wine deals
    }
  }
  
  // Check for specific cocktails
  if (drinkNameLower.includes('margarita')) return 'margarita';
  if (drinkNameLower.includes('espresso martini')) return 'espresso_martini';
  if (drinkNameLower.includes('martini')) return 'martini';
  if (drinkNameLower.includes('singapore sling')) return 'singapore_sling';
  if (drinkNameLower.includes('cosmopolitan')) return 'cosmopolitan';
  if (drinkNameLower.includes('highball')) return 'highball';
  if (drinkNameLower.includes('gin tonic') || drinkNameLower.includes('gin & tonic')) return 'gin_tonic';
  
  // Check for specific spirit glasses
  if ((drinkNameLower.includes('whisky') || drinkNameLower.includes('whiskey')) && !drinkNameLower.includes('bottle')) return 'whisky_glass';
  if (drinkNameLower.includes('vodka') && !drinkNameLower.includes('bottle')) return 'vodka_glass';
  if (drinkNameLower.includes('rum') && !drinkNameLower.includes('bottle')) return 'rum_glass';
  
  // Check for specific spirit bottles
  if ((drinkNameLower.includes('whisky') || drinkNameLower.includes('whiskey')) && drinkNameLower.includes('bottle')) return 'whisky_bottle';
  if (drinkNameLower.includes('vodka') && drinkNameLower.includes('bottle')) return 'vodka_bottle';
  if (drinkNameLower.includes('rum') && drinkNameLower.includes('bottle')) return 'rum_bottle';
  if ((drinkNameLower.includes('tequila') || drinkNameLower.includes('tequilla')) && drinkNameLower.includes('bottle')) return 'tequila_bottle';
  if (drinkNameLower.includes('gin') && drinkNameLower.includes('bottle')) return 'gin_bottle';
  
  // Check for specific wine glasses
  if (drinkNameLower.includes('red wine') || drinkNameLower.includes('wine') && drinkNameLower.includes('red')) return 'red_wine_glass';
  if (drinkNameLower.includes('white wine') || drinkNameLower.includes('wine') && drinkNameLower.includes('white')) return 'white_wine_glass';
  if (drinkNameLower.includes('bubbly') || drinkNameLower.includes('champagne')) return 'bubbly_glass';
  if (drinkNameLower.includes('prosecco')) return 'prosecco_glass';
  if (drinkNameLower.includes('sake')) return 'sake_glass';
  if (drinkNameLower.includes('soju')) return 'soju_glass';
  
  // If we've made it this far, fallback to category-based defaults
  if (categoryLower.includes('beer')) {
    if (drinkNameLower.includes('pint')) return 'beer_pint';
    return 'beer_pint'; // Default beer presentation is a pint
  }
  
  if (categoryLower.includes('wine')) {
    return 'red_wine_glass'; // Default wine is red wine in a glass
  }
  
  if (categoryLower.includes('cocktail')) {
    return 'cocktail'; // Default cocktail presentation
  }
  
  if (categoryLower.includes('spirit') || categoryLower.includes('whisky') || categoryLower.includes('whiskey') || 
      categoryLower.includes('vodka') || categoryLower.includes('rum') || categoryLower.includes('gin')) {
    return 'whisky_glass'; // Default spirit presentation is whisky in a glass
  }
  
  // Final fallback is beer pint
  return 'beer_pint';
}

/**
 * Get a color hex code for a specific drink category
 * Used for creating SVG fallbacks
 * 
 * @param category The drink category
 * @returns A hex color code suitable for the drink category
 */
export function getDrinkCategoryColor(category: string): string {
  // Use lowercase for comparison
  const lowerCategory = category.toLowerCase();
  
  // Beer colors (amber/gold)
  if (lowerCategory.includes('beer') || lowerCategory.includes('pint')) {
    return '#D4A017'; // Amber/gold for beer
  } 
  
  // Wine colors
  if (lowerCategory.includes('red_wine')) {
    return '#800000'; // Burgundy for red wine
  }
  if (lowerCategory.includes('white_wine')) {
    return '#F5F5DC'; // Beige for white wine
  }
  if (lowerCategory.includes('bubbly') || lowerCategory.includes('champagne') || lowerCategory.includes('prosecco')) {
    return '#F7E7CE'; // Light champagne color
  }
  
  // Cocktail colors
  if (lowerCategory.includes('cocktail')) {
    return '#4863A0'; // Blue for generic cocktails
  }
  if (lowerCategory.includes('margarita')) {
    return '#ADFF2F'; // Bright green for margarita
  }
  if (lowerCategory.includes('martini')) {
    return '#C0C0C0'; // Silver for martini
  }
  if (lowerCategory.includes('cosmopolitan')) {
    return '#FF1493'; // Deep pink for cosmopolitan
  }
  
  // Spirit colors
  if (lowerCategory.includes('whisky') || lowerCategory.includes('whiskey')) {
    return '#C35817'; // Amber brown for whisky
  }
  if (lowerCategory.includes('vodka') || lowerCategory.includes('gin')) {
    return '#C0C0C0'; // Silver for clear spirits
  }
  if (lowerCategory.includes('rum')) {
    return '#C68E17'; // Dark rum color
  }
  
  // Default blue
  return '#3090C7';
}