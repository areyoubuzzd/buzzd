/**
 * Utilities for working with Cloudinary images
 */

// Map to keep track of which images have been used for each drink
// This helps prevent the same image from appearing twice in a view
const usedImagesMap = new Map<string, Set<number>>();

/**
 * Convert a drink name to a standardized format for Cloudinary folder names
 * Example: "Heineken Pint" -> "heineken_pint"
 */
export function formatDrinkNameForCloudinary(drinkName: string): string {
  if (!drinkName) return 'unknown';
  
  return drinkName
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '_'); // Replace spaces with underscores
}

/**
 * Get a Cloudinary URL for a drink image
 * 
 * @param drinkName The name of the drink
 * @param maxImages Maximum number of images expected in the folder
 * @param width Desired image width
 * @param height Desired image height
 * @returns A Cloudinary URL for a random image of the drink
 */
// Map of drink names to their actual Cloudinary image IDs
const drinkImageMap: Record<string, string[]> = {
  'heineken pint': [
    'Heineken_pint1_zoq54g',
    'Heineken_pint2_qaseup',
    'Heineken_pint2_ggxotg',
    'Heineken_pint4_vfaq0c',
    'Heineken_pint5_lp3d2i'
  ],
  // Add more mappings as more image sets are added to Cloudinary
};

// Debug function to test if a Cloudinary image exists
async function doesImageExist(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking image existence:', error);
    return false;
  }
}

export function getRandomDrinkImageUrl(
  drinkName: string, 
  maxImages: number = 5, 
  width: number = 400, 
  height: number = 400
): string {
  console.log(`Generating image URL for "${drinkName}"`);
  
  if (!drinkName) {
    return getDefaultDrinkImageUrl(width, height);
  }

  // The working URL format is:
  // https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744936848/red_wine_glass_jhrawp.webp

  // Known existing Cloudinary images with folder structure 
  // Format: https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/5.jpg
  const knownDrinkImages: Record<string, string[]> = {
    'asahi pint': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/asahi_pint/1.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/asahi_pint/2.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/asahi_pint/3.jpg'
    ],
    'tiger pint': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/tiger_pint/1.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/tiger_pint/2.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/tiger_pint/3.jpg'
    ],
    'heineken pint': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/1.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/2.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744936265/home/brands/beer/heineken_pint/3.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/4.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/5.jpg'
    ],
    'red wine': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744942262/home/brands/wine/red/2.webp',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744942262/home/brands/wine/red/1.webp',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/wine/red/2.webp'
    ],
    'white wine': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/wine/white_wine/1.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/wine/white_wine/2.jpg'
    ],
    'margarita': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/cocktail/margarita/1.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/cocktail/margarita/2.jpg'
    ],
    'negroni': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/cocktail/negroni/1.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/cocktail/negroni/2.jpg'
    ],
    'mojito': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/cocktail/mojito/1.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/cocktail/mojito/2.jpg'
    ],
    'whisky': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/spirits/whisky/1.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/spirits/whisky/2.jpg'
    ],
    'chivas': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/spirits/chivas/1.jpg',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/spirits/chivas/2.jpg'
    ]
  };
  
  // Standard format for drink names is lowercase
  const lowerDrinkName = drinkName.toLowerCase();
  
  // If we have known images for this drink, use one of them
  if (knownDrinkImages[lowerDrinkName] && knownDrinkImages[lowerDrinkName].length > 0) {
    const drinkImages = knownDrinkImages[lowerDrinkName];
    // Use a consistent index based on the drink name to avoid changing on every reload
    // But still provide some variety between different drinks
    const nameHash = lowerDrinkName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = nameHash % drinkImages.length;
    
    console.log(`Using known image for ${drinkName}: ${drinkImages[imageIndex]}`);
    return drinkImages[imageIndex];
  }
  
  // For unknown drinks, we'll create a URL using the folder structure format:
  // Format: https://res.cloudinary.com/dp2uoj3ts/image/upload/home/brands/beer/heineken_pint/5.jpg
  
  const formattedDrinkName = formatDrinkNameForCloudinary(drinkName);
  
  // Determine the category based on drink name
  let category = 'other';
  if (formattedDrinkName.includes('pint') || formattedDrinkName.includes('beer')) {
    category = 'beer';
  } else if (formattedDrinkName.includes('wine')) {
    category = 'wine';
  } else if (formattedDrinkName.includes('whisky') || formattedDrinkName.includes('vodka') || 
             formattedDrinkName.includes('rum') || formattedDrinkName.includes('gin')) {
    category = 'spirits';
  } else if (formattedDrinkName.includes('margarita') || formattedDrinkName.includes('mojito') || 
             formattedDrinkName.includes('cocktail') || formattedDrinkName.includes('martini')) {
    category = 'cocktail';
  }
  
  // Generate appropriate image number depending on category
  let randomNumber;
  
  // Try to determine if we should use .webp or .jpg extension
  // For wine category, try to use the new folder structure with webp format
  if (category === 'wine') {
    // For wines, we only want to use the confirmed working image numbers (1-2)
    randomNumber = Math.floor(Math.random() * 2) + 1;
    
    // First check if it's red or white wine
    let wineType = 'red'; // Default to red since we know that works
    if (formattedDrinkName.includes('white')) {
      wineType = 'red'; // Use red for now since we confirmed white doesn't work yet
    } else if (formattedDrinkName.includes('rose') || formattedDrinkName.includes('rosé')) {
      wineType = 'red'; // Use red for now
    } else if (formattedDrinkName.includes('sparkling') || formattedDrinkName.includes('champagne')) {
      wineType = 'red'; // Use red for now
    }
    
    // Use newer webp path for wine with version number
    // Format matches: https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744942262/home/brands/wine/red/2.webp
    const currentVersion = "v1744942262"; // Using the exact version from the working image
    const webpImageUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/${currentVersion}/home/brands/wine/red/${randomNumber}.webp`;
    console.log(`Generated wine URL for ${drinkName}: ${webpImageUrl}`);
    return webpImageUrl;
  }
  
  // For beer category, use updated path and version 
  // Format example: https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744936265/home/brands/beer/heineken_pint/3.jpg
  else if (category === 'beer') {
    // For beers, use 1-5 as image numbers
    randomNumber = Math.floor(Math.random() * 5) + 1;
    
    // We have a confirmed working version number for heineken_pint
    if (formattedDrinkName === 'heineken_pint') {
      const beerVersion = "v1744936265"; // Version from beer working image
      const beerImageUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/${beerVersion}/home/brands/beer/${formattedDrinkName}/${randomNumber}.jpg`;
      console.log(`Generated beer URL for ${drinkName}: ${beerImageUrl}`);
      return beerImageUrl;
    }
    // For other beers, use standard format without version number as it works
    else {
      const beerImageUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/home/brands/beer/${formattedDrinkName}/${randomNumber}.jpg`;
      console.log(`Generated beer URL for ${drinkName}: ${beerImageUrl}`);
      return beerImageUrl;
    }
  }
  
  // For all other categories, use the original jpg format
  randomNumber = Math.floor(Math.random() * 3) + 1; // Use 1-3 for other categories
  const imageUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/home/brands/${category}/${formattedDrinkName}/${randomNumber}.jpg`;
  
  console.log(`Generated URL for ${drinkName}: ${imageUrl}`);
  return imageUrl;
}

/**
 * Get a unique random index for a drink that hasn't been used yet
 * This helps ensure we don't show the same image twice for the same drink
 */
function getUniqueRandomIndex(drinkKey: string, maxImages: number): number {
  // If we only have one image or no images have been tracked, return a random index
  if (maxImages <= 1) return 1;
  
  // Get or create the set of used indices for this drink
  if (!usedImagesMap.has(drinkKey)) {
    usedImagesMap.set(drinkKey, new Set<number>());
  }
  
  const usedIndices = usedImagesMap.get(drinkKey)!;
  
  // If we've used all available images, clear the set and start over
  if (usedIndices.size >= maxImages) {
    usedIndices.clear();
  }
  
  // Generate random indices until we find one that hasn't been used
  let randomIndex: number;
  do {
    randomIndex = Math.floor(Math.random() * maxImages) + 1; // 1-based index
  } while (usedIndices.has(randomIndex) && usedIndices.size < maxImages);
  
  // Track that we've used this index
  usedIndices.add(randomIndex);
  
  return randomIndex;
}

/**
 * Get a default image URL for when a drink-specific image isn't available
 */
export function getDefaultDrinkImageUrl(width: number = 400, height: number = 400): string {
  const defaultCategoryMap: Record<string, string> = {
    'Beer': 'beer',
    'Cocktail': 'cocktail',
    'Wine / Spirits': 'wine',
    'Wine': 'wine',
    'Spirits': 'spirits',
    'Whisky': 'whisky'
  };
  
  // Use a generic drink image as fallback using the folder structure
  // We'll use jpg format as our primary extension since that works reliably with our tests
  return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/home/defaults/generic_drink/1.jpg`;
}

/**
 * Get a drink category image URL
 */
export function getDrinkCategoryImageUrl(category: string, width: number = 400, height: number = 400): string {
  if (!category) {
    return getDefaultDrinkImageUrl(width, height);
  }
  
  const categoryKey = category.toLowerCase().replace(/[^\w\s]/g, '').trim().replace(/\s+/g, '_');
  
  // Use folder structure format for category images as well
  return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/home/categories/${categoryKey}/1.jpg`;
}

/**
 * Create a React hook for managing drink images
 * This is useful when you need to fetch images for multiple drinks
 */
export function createDrinkImageRegistry() {
  const imageRegistry = new Map<string, string>();
  
  // Function to get or generate an image URL for a drink
  const getImageUrl = (drinkName: string, maxImages: number = 5, width: number = 400, height: number = 400): string => {
    if (!drinkName) return getDefaultDrinkImageUrl(width, height);
    
    // If we already have an image for this drink, return it
    const key = `${drinkName}_${width}x${height}`;
    if (imageRegistry.has(key)) {
      return imageRegistry.get(key)!;
    }
    
    // Generate a new URL
    const url = getRandomDrinkImageUrl(drinkName, maxImages, width, height);
    imageRegistry.set(key, url);
    return url;
  };
  
  return { getImageUrl };
}