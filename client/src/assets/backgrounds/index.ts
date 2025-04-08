// Background images for different alcohol categories
export const backgrounds = {
  beer: '/backgrounds/beer-bg.jpg',
  wine: '/backgrounds/wine-bg.jpg',
  red_wine: '/backgrounds/wine-bg.jpg',
  white_wine: '/backgrounds/wine-bg.jpg',
  bubbly: '/backgrounds/wine-bg.jpg',
  cocktail: '/backgrounds/cocktail-bg.jpg',
  whisky: '/backgrounds/spirit-bg.jpg',
  vodka: '/backgrounds/spirit-bg.jpg',
  rum: '/backgrounds/spirit-bg.jpg',
  gin: '/backgrounds/spirit-bg.jpg',
  default: '/backgrounds/default-bg.jpg'
};

export function getBackgroundImage(category: string): string {
  const formattedCategory = category.toLowerCase();
  
  if (formattedCategory in backgrounds) {
    return backgrounds[formattedCategory as keyof typeof backgrounds];
  }
  
  // Fallbacks
  if (formattedCategory.includes('wine')) {
    return backgrounds.wine;
  } else if (formattedCategory.includes('cocktail')) {
    return backgrounds.cocktail;
  } else if (['whisky', 'vodka', 'rum', 'gin'].includes(formattedCategory)) {
    return backgrounds.whisky;
  }
  
  return backgrounds.default;
}