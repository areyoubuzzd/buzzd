// Import actual hero images
import asahiPint from './Asahi_pint.png';
import heinekenPint from './Heineken_pint.png';
import sapporoPint from './Sapporo_pint.png';
import margarita from './margarita.png';
import monkeyShoulder from './MonkeyShoulder.png';

// Hero images (bottles/glasses) for different alcohol categories
export const heroes = {
  beer: {
    bottle: heinekenPint,
    glass: heinekenPint,
    asahi: asahiPint,
    heineken: heinekenPint,
    sapporo: sapporoPint
  },
  wine: {
    bottle: monkeyShoulder,
    glass: monkeyShoulder,
  },
  red_wine: {
    bottle: monkeyShoulder,
    glass: monkeyShoulder,
  },
  white_wine: {
    bottle: monkeyShoulder,
    glass: monkeyShoulder,
  },
  bubbly: {
    bottle: monkeyShoulder,
    glass: monkeyShoulder,
  },
  cocktail: {
    glass: margarita,
    margarita: margarita
  },
  whisky: {
    bottle: monkeyShoulder,
    glass: monkeyShoulder,
    monkey_shoulder: monkeyShoulder
  },
  vodka: {
    bottle: monkeyShoulder,
    glass: monkeyShoulder,
  },
  rum: {
    bottle: monkeyShoulder,
    glass: monkeyShoulder,
  },
  gin: {
    bottle: monkeyShoulder,
    glass: monkeyShoulder,
  },
};

export function getHeroImage(category: string, servingStyle: 'bottle' | 'glass' = 'glass'): any {
  // First prioritize specific brands regardless of category
  const lowerCategory = (category || '').toLowerCase();
  
  // Brand-specific checks
  if (lowerCategory.includes('asahi')) {
    return heroes.beer.asahi;
  }
  
  if (lowerCategory.includes('heineken')) {
    return heroes.beer.heineken;
  }
  
  if (lowerCategory.includes('sapporo')) {
    return heroes.beer.sapporo;
  }
  
  if (lowerCategory.includes('margarita')) {
    return heroes.cocktail.margarita;
  }
  
  if (lowerCategory.includes('monkey')) {
    return heroes.whisky.monkey_shoulder;
  }
  
  // Category-based selection
  // First check if the exact category exists
  if (lowerCategory in heroes) {
    const categoryHeroes = heroes[lowerCategory as keyof typeof heroes];
    
    // If the requested serving style exists for this category
    if (servingStyle in categoryHeroes) {
      return categoryHeroes[servingStyle as keyof typeof categoryHeroes];
    }
    
    // Default to glass if bottle not available, or the first available style
    return 'glass' in categoryHeroes
      ? categoryHeroes.glass
      : Object.values(categoryHeroes)[0];
  }
  
  // Fallbacks for category-like strings
  if (lowerCategory.includes('beer')) {
    return heroes.beer.glass;
  } else if (lowerCategory.includes('wine')) {
    return heroes.wine.glass;
  } else if (lowerCategory.includes('cocktail')) {
    return heroes.cocktail.glass;
  } else if (lowerCategory.includes('whisky') || lowerCategory.includes('whiskey')) {
    return heroes.whisky.glass;
  } else if (lowerCategory.includes('vodka')) {
    return heroes.vodka.glass;
  } else if (lowerCategory.includes('rum')) {
    return heroes.rum.glass;
  } else if (lowerCategory.includes('gin')) {
    return heroes.gin.glass;
  }
  
  // If we're dealing with a beer, prioritize beer images
  if (lowerCategory.includes('lager') || lowerCategory.includes('ale') || 
      lowerCategory.includes('stout') || lowerCategory.includes('ipa')) {
    return heroes.beer.glass;
  }
  
  // Default fallback to beer
  return heroes.beer.glass;
}