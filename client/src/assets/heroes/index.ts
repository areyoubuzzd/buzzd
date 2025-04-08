// Hero images (bottles/glasses) for different alcohol categories
export const heroes = {
  beer: {
    bottle: '/heroes/beer-bottle.png',
    glass: '/heroes/beer-glass.png',
  },
  wine: {
    bottle: '/heroes/wine-bottle.png',
    glass: '/heroes/wine-glass.png',
  },
  red_wine: {
    bottle: '/heroes/wine-bottle.png',
    glass: '/heroes/wine-glass.png',
  },
  white_wine: {
    bottle: '/heroes/wine-bottle.png',
    glass: '/heroes/wine-glass.png',
  },
  bubbly: {
    bottle: '/heroes/bubbly-bottle.png',
    glass: '/heroes/bubbly-glass.png',
  },
  cocktail: {
    glass: '/heroes/cocktail-glass.png',
  },
  whisky: {
    bottle: '/heroes/whisky-bottle.png',
    glass: '/heroes/whisky-glass.png',
  },
  vodka: {
    bottle: '/heroes/vodka-bottle.png',
    glass: '/heroes/vodka-glass.png',
  },
  rum: {
    bottle: '/heroes/rum-bottle.png',
    glass: '/heroes/rum-glass.png',
  },
  gin: {
    bottle: '/heroes/gin-bottle.png',
    glass: '/heroes/gin-glass.png',
  },
};

export function getHeroImage(category: string, servingStyle: 'bottle' | 'glass' = 'glass'): string {
  const formattedCategory = category.toLowerCase();
  
  // Check if the category exists
  if (formattedCategory in heroes) {
    const categoryHeroes = heroes[formattedCategory as keyof typeof heroes];
    
    // If the requested serving style exists for this category
    if (servingStyle in categoryHeroes) {
      return categoryHeroes[servingStyle as keyof typeof categoryHeroes];
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