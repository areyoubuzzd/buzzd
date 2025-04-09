// Import actual hero images
import asahiPint from './Asahi_glass.png';
import heinekenPint from './heineken_glass.png';
import sapporoPint from './Sapporo_pint.png';
import margarita from './margarita.png';
import monkeyShoulder from './Monkey Shoulder.png';

// Wine images
import redWineGlass from './redwine-glass.png';
import whiteWineGlass from './white-wine-glass.png';
import housePourWine from './House-Pour-wine.png';

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
    bottle: housePourWine,
    glass: redWineGlass,
    house: housePourWine,
    red: redWineGlass,
    white: whiteWineGlass,
  },
  red_wine: {
    bottle: housePourWine,
    glass: redWineGlass,
  },
  white_wine: {
    bottle: housePourWine,
    glass: whiteWineGlass,
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
  // For easier debugging, log what's being requested
  // console.log("Getting hero for:", category, servingStyle);
  
  // First prioritize specific brands regardless of category
  const lowerCategory = (category || '').toLowerCase();
  
  // Brand-specific checks - beer brands
  if (lowerCategory.includes('asahi')) {
    return heroes.beer.asahi;
  }
  
  if (lowerCategory.includes('heineken')) {
    return heroes.beer.heineken;
  }
  
  if (lowerCategory.includes('sapporo')) {
    return heroes.beer.sapporo;
  }
  
  // Cocktail types
  if (lowerCategory.includes('margarita')) {
    return heroes.cocktail.margarita;
  }
  
  // Whisky brands
  if (lowerCategory.includes('monkey') || lowerCategory.includes('shoulder')) {
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
  } 
  // Wine categories - Simplify to just red, white, or general wine
  // Check for subcategories that indicate white wine
  else if (lowerCategory.includes('wine') && 
          (lowerCategory.includes('white') || 
           lowerCategory.includes('sauvignon') || 
           lowerCategory.includes('blanc') || 
           lowerCategory.includes('pinot gris') || 
           lowerCategory.includes('chardonnay') || 
           lowerCategory.includes('riesling'))) {
    return heroes.wine.white;
  } 
  // Check for subcategories that indicate red wine
  else if (lowerCategory.includes('wine') && 
          (lowerCategory.includes('red') || 
           lowerCategory.includes('cabernet') || 
           lowerCategory.includes('merlot') || 
           lowerCategory.includes('syrah') || 
           lowerCategory.includes('shiraz') || 
           lowerCategory.includes('pinot noir') || 
           lowerCategory.includes('malbec'))) {
    return heroes.wine.red;
  } 
  // Default wine to red wine image
  else if (lowerCategory.includes('wine')) {
    return heroes.wine.red; // Default wine to red wine glass
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