// This file provides direct imports to alcohol images

// Local images for beer
import beerBackground from './backgrounds/beer-bg.svg';
import beerBottle from './brands/beer-bottle.svg';
import beerGlass from './brands/beer-glass.svg';

// Local images for wine
import wineBackground from './backgrounds/wine-bg.svg';
import wineBottle from './brands/wine-bottle.svg';
import wineGlass from './brands/wine-glass.svg';

// Local images for cocktails
import cocktailBackground from './backgrounds/cocktail-bg.svg';
import cocktailGlass from './brands/cocktail-glass.svg';

// Local images for spirits
import spiritBackground from './backgrounds/spirit-bg.svg';
import spiritBottle from './brands/spirit-bottle.svg';
import spiritGlass from './brands/spirit-glass.svg';

// Bundle all images by category and type
export const images = {
  beer: {
    background: beerBackground,
    bottle: beerBottle,
    glass: beerGlass,
  },
  wine: {
    background: wineBackground,
    bottle: wineBottle,
    glass: wineGlass,
  },
  red_wine: {
    background: wineBackground,
    bottle: wineBottle,
    glass: wineGlass,
  },
  white_wine: {
    background: wineBackground,
    bottle: wineBottle,
    glass: wineGlass,
  },
  bubbly: {
    background: wineBackground,
    bottle: wineBottle,
    glass: wineGlass,
  },
  cocktail: {
    background: cocktailBackground,
    glass: cocktailGlass,
  },
  whisky: {
    background: spiritBackground,
    bottle: spiritBottle,
    glass: spiritGlass,
  },
  vodka: {
    background: spiritBackground,
    bottle: spiritBottle,
    glass: spiritGlass,
  },
  rum: {
    background: spiritBackground,
    bottle: spiritBottle,
    glass: spiritGlass,
  },
  gin: {
    background: spiritBackground,
    bottle: spiritBottle,
    glass: spiritGlass,
  },
};

// Default image getter functions
export function getBackgroundImage(category: string): string {
  const formattedCategory = category.toLowerCase();
  const categoryImages = images[formattedCategory as keyof typeof images];
  
  if (categoryImages && 'background' in categoryImages) {
    return categoryImages.background;
  }
  
  // Fallbacks
  if (formattedCategory.includes('wine')) {
    return images.wine.background;
  } else if (formattedCategory.includes('cocktail')) {
    return images.cocktail.background;
  } else if (['whisky', 'vodka', 'rum', 'gin'].includes(formattedCategory)) {
    return images.whisky.background;
  }
  
  return images.beer.background; // Default fallback
}

export function getBrandImage(category: string, servingStyle: 'bottle' | 'glass' = 'glass'): string {
  const formattedCategory = category.toLowerCase();
  const categoryImages = images[formattedCategory as keyof typeof images];

  if (categoryImages && servingStyle in categoryImages) {
    return categoryImages[servingStyle as keyof typeof categoryImages];
  }
  
  // Fallbacks
  if (formattedCategory.includes('wine')) {
    return servingStyle === 'bottle' ? images.wine.bottle : images.wine.glass;
  } else if (formattedCategory.includes('cocktail')) {
    return images.cocktail.glass;
  } else if (['whisky', 'vodka', 'rum', 'gin'].includes(formattedCategory)) {
    return servingStyle === 'bottle' ? images.whisky.bottle : images.whisky.glass;
  }
  
  return servingStyle === 'bottle' ? images.beer.bottle : images.beer.glass; // Default fallback
}