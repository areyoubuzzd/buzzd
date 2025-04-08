/**
 * Utility functions for handling drink images
 * This uses the public folder structure to efficiently load images
 */

// Background Images: Mapping of categories to background image paths
const backgroundMap: Record<string, string> = {
  beer: '/images/backgrounds/beer-bg.jpg',
  wine: '/images/backgrounds/wine-bg.jpg',
  red_wine: '/images/backgrounds/wine-bg.jpg',
  white_wine: '/images/backgrounds/wine-bg.jpg',
  bubbly: '/images/backgrounds/wine-bg.jpg',
  cocktail: '/images/backgrounds/cocktail-bg.jpg',
  whisky: '/images/backgrounds/spirit-bg.jpg',
  vodka: '/images/backgrounds/spirit-bg.jpg',
  rum: '/images/backgrounds/spirit-bg.jpg',
  gin: '/images/backgrounds/spirit-bg.jpg',
  default: '/images/backgrounds/default-bg.jpg'
};

// Hero Images: Mapping of categories and serving styles to hero image paths
const heroMap: Record<string, Record<string, string>> = {
  beer: {
    bottle: '/images/heroes/beer-bottle.png',
    glass: '/images/heroes/beer-glass.png',
  },
  wine: {
    bottle: '/images/heroes/wine-bottle.png',
    glass: '/images/heroes/wine-glass.png',
  },
  red_wine: {
    bottle: '/images/heroes/wine-bottle.png',
    glass: '/images/heroes/wine-glass.png',
  },
  white_wine: {
    bottle: '/images/heroes/wine-bottle.png',
    glass: '/images/heroes/wine-glass.png',
  },
  bubbly: {
    bottle: '/images/heroes/bubbly-bottle.png',
    glass: '/images/heroes/bubbly-glass.png',
  },
  cocktail: {
    glass: '/images/heroes/cocktail-glass.png',
  },
  whisky: {
    bottle: '/images/heroes/whisky-bottle.png',
    glass: '/images/heroes/whisky-glass.png',
  },
  vodka: {
    bottle: '/images/heroes/spirit-bottle.png',
    glass: '/images/heroes/spirit-glass.png',
  },
  rum: {
    bottle: '/images/heroes/spirit-bottle.png',
    glass: '/images/heroes/spirit-glass.png',
  },
  gin: {
    bottle: '/images/heroes/spirit-bottle.png',
    glass: '/images/heroes/spirit-glass.png',
  },
  default: {
    bottle: '/images/heroes/beer-bottle.png',
    glass: '/images/heroes/beer-glass.png',
  }
};

/**
 * Get a background image based on alcohol category
 */
export function getBackgroundImage(category: string): string {
  const formattedCategory = category.toLowerCase();
  
  // Check direct match first
  if (formattedCategory in backgroundMap) {
    return backgroundMap[formattedCategory];
  }
  
  // Fallbacks based on partial matches
  if (formattedCategory.includes('wine')) {
    return backgroundMap.wine;
  } else if (formattedCategory.includes('cocktail')) {
    return backgroundMap.cocktail;
  } else if (['whisky', 'whiskey', 'vodka', 'rum', 'gin'].includes(formattedCategory)) {
    return backgroundMap.whisky;
  }
  
  // Default fallback
  return backgroundMap.default;
}

/**
 * Get a hero image based on alcohol category and serving style
 */
export function getHeroImage(category: string, servingStyle: 'bottle' | 'glass' = 'glass'): string {
  const formattedCategory = category.toLowerCase();
  
  // Check if category exists in the map
  if (formattedCategory in heroMap) {
    const categoryHeroes = heroMap[formattedCategory];
    
    // Check if the requested serving style exists for this category
    if (servingStyle in categoryHeroes) {
      return categoryHeroes[servingStyle];
    }
    
    // Default to first available style if requested style doesn't exist
    const availableStyles = Object.keys(categoryHeroes);
    if (availableStyles.length > 0) {
      return categoryHeroes[availableStyles[0]];
    }
  }
  
  // Fallbacks based on partial matches
  if (formattedCategory.includes('wine')) {
    return servingStyle === 'bottle' ? heroMap.wine.bottle : heroMap.wine.glass;
  } else if (formattedCategory.includes('cocktail')) {
    return heroMap.cocktail.glass;
  } else if (['whisky', 'whiskey', 'vodka', 'rum', 'gin'].includes(formattedCategory)) {
    return servingStyle === 'bottle' ? heroMap.whisky.bottle : heroMap.whisky.glass;
  }
  
  // Ultimate fallback
  return servingStyle === 'bottle' ? heroMap.default.bottle : heroMap.default.glass;
}