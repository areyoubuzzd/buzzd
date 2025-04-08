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
  const formattedCategory = category.toLowerCase();
  
  // Check if the category exists
  if (formattedCategory in heroes) {
    const categoryHeroes = heroes[formattedCategory as keyof typeof heroes];
    
    // If the requested serving style exists for this category
    if (servingStyle in categoryHeroes) {
      return categoryHeroes[servingStyle as keyof typeof categoryHeroes];
    }
    
    // Check for special brands
    if (category.toLowerCase().includes('asahi')) {
      return heroes.beer.asahi;
    }
    
    if (category.toLowerCase().includes('heineken')) {
      return heroes.beer.heineken;
    }
    
    if (category.toLowerCase().includes('sapporo')) {
      return heroes.beer.sapporo;
    }
    
    if (category.toLowerCase().includes('margarita')) {
      return heroes.cocktail.margarita;
    }
    
    if (category.toLowerCase().includes('monkey')) {
      return heroes.whisky.monkey_shoulder;
    }
    
    // Default to glass if bottle not available, or the first available style
    return 'glass' in categoryHeroes
      ? categoryHeroes.glass
      : Object.values(categoryHeroes)[0];
  }
  
  // Fallbacks
  if (formattedCategory.includes('wine')) {
    return servingStyle === 'bottle' ? heroes.wine.bottle : heroes.wine.glass;
  } else if (formattedCategory.includes('cocktail')) {
    return heroes.cocktail.glass;
  } else if (['whisky', 'vodka', 'rum', 'gin'].includes(formattedCategory)) {
    return servingStyle === 'bottle' ? heroes.whisky.bottle : heroes.whisky.glass;
  }
  
  // Default fallback to beer
  return servingStyle === 'bottle' ? heroes.beer.bottle : heroes.beer.glass;
}