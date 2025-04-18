/**
 * Utility functions for handling Google Drive image URLs
 */

// Map to remember which image indices have been used for each drink
// This helps ensure we don't show the same image twice for the same drink
const usedImagesMap = new Map<string, Set<number>>();

/**
 * Convert a drink name to a standardized format for folder names
 * Example: "Heineken Pint" -> "heineken_pint"
 */
export function formatDrinkNameForFolder(drinkName: string): string {
  if (!drinkName) return 'unknown';
  
  // Convert to lowercase and replace spaces and special characters with underscores
  return drinkName.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '_'); // Replace spaces with underscores
}

/**
 * Get a random image URL for a specific drink
 * 
 * This function generates URLs based on the following pattern:
 * 1. Images should be stored in Google Drive with public access
 * 2. Images should be named with sequential numbers (1.jpg, 2.jpg, etc.)
 * 
 * To use:
 * 1. Create a folder structure in Google Drive for drink categories (beer, wine, cocktail)
 * 2. Inside each category, create folders for specific drinks (heineken_pint, tiger_pint)
 * 3. Place images in these folders with sequential numbered names (1.jpg, 2.jpg)
 * 4. Get the direct Google Drive sharing links for these images
 */
export function getRandomDrinkImageUrl(
  drinkName: string,
  maxImages: number = 5,
  width: number = 400, 
  height: number = 400
): string {
  if (!drinkName) return getDefaultDrinkImageUrl(width, height);
  
  // Get a random image index that hasn't been used for this drink yet
  const folderName = formatDrinkNameForFolder(drinkName);
  const imageIndex = getUniqueRandomIndex(folderName, maxImages);
  
  // Determine the drink category (beer, wine, cocktail, etc.)
  let drinkCategory = 'beer'; // Default category
  if (drinkName.toLowerCase().includes('wine')) {
    drinkCategory = 'wine';
  } else if (drinkName.toLowerCase().includes('cocktail') || 
             drinkName.toLowerCase().includes('margarita') ||
             drinkName.toLowerCase().includes('mojito') ||
             drinkName.toLowerCase().includes('martini')) {
    drinkCategory = 'cocktail';
  } else if (drinkName.toLowerCase().includes('whisky') || 
             drinkName.toLowerCase().includes('whiskey') ||
             drinkName.toLowerCase().includes('bourbon')) {
    drinkCategory = 'whisky';
  } else if (drinkName.toLowerCase().includes('vodka') || 
             drinkName.toLowerCase().includes('gin') ||
             drinkName.toLowerCase().includes('rum') ||
             drinkName.toLowerCase().includes('tequila')) {
    drinkCategory = 'spirits';
  }

  // For known specific drinks, return their direct Google Drive URLs
  // Replace these with actual Google Drive image URLs for specific drinks
  const drinkImageMap: Record<string, string[]> = {
    'tiger_pint': [
      // Add direct Google Drive image URLs here for Tiger Pint
      'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID_HERE',
    ],
    'heineken_pint': [
      // Add direct Google Drive image URLs here for Heineken Pint
      'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID_HERE',
    ],
    // Add more drink-specific image URLs as needed
  };

  // If we have specific images for this drink, use one of them
  if (drinkImageMap[folderName] && drinkImageMap[folderName].length > 0) {
    // Get a random image from the available ones for this drink
    const availableImages = drinkImageMap[folderName];
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    
    console.log(`Using specific image for ${drinkName}: ${availableImages[randomIndex]}`);
    return availableImages[randomIndex];
  }

  // For demo purposes, let's use a placeholder image service if we don't have a specific URL
  // In production, replace this with your actual Google Drive image URLs
  const placeholderUrl = `https://placehold.co/${width}x${height}/${getColorForDrink(drinkName)}/FFFFFF?text=${encodeURIComponent(drinkName)}`;
  
  console.log(`Using placeholder image for ${drinkName}: ${placeholderUrl}`);
  return placeholderUrl;
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
  // Replace with your actual default image URL from Google Drive
  return `https://placehold.co/${width}x${height}/7F5AF0/FFFFFF?text=Drink`;
}

/**
 * Get a drink category image URL
 */
export function getDrinkCategoryImageUrl(category: string, width: number = 400, height: number = 400): string {
  if (!category) {
    return getDefaultDrinkImageUrl(width, height);
  }
  
  const categoryKey = category.toLowerCase().replace(/[^\w\s]/g, '').trim().replace(/\s+/g, '_');
  
  // Replace with your actual category image URLs from Google Drive
  return `https://placehold.co/${width}x${height}/22D3EE/FFFFFF?text=${encodeURIComponent(category)}`;
}

/**
 * Helper to generate a consistent color based on drink name
 */
function getColorForDrink(drinkName: string): string {
  const colors = {
    beer: '00594C',    // Dark green for beers
    wine: '7F1D1D',    // Dark red for wines
    cocktail: 'D97706', // Orange for cocktails
    spirits: '1E3A8A', // Dark blue for spirits
    whisky: 'B45309',  // Brown for whisky
    default: '4B5563'  // Gray for unknown
  };
  
  const name = drinkName.toLowerCase();
  if (name.includes('beer') || name.includes('lager') || name.includes('pint')) return colors.beer;
  if (name.includes('wine')) return colors.wine;
  if (name.includes('cocktail') || name.includes('margarita') || name.includes('mojito')) return colors.cocktail;
  if (name.includes('whisky') || name.includes('whiskey') || name.includes('bourbon')) return colors.whisky;
  if (name.includes('vodka') || name.includes('gin') || name.includes('rum')) return colors.spirits;
  
  return colors.default;
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