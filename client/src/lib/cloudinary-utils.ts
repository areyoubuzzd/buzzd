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

  // Format drink name for URL
  const formattedDrinkName = formatDrinkNameForCloudinary(drinkName);
  
  // Generate a random image index (1-based)
  const imageIndex = getUniqueRandomIndex(drinkName.toLowerCase(), maxImages);
  
  // Map of known transformation suffixes for different drinks
  const knownImageTransformations = {
    // Number-based images (format: [number]_[suffix])
    '1_pmxkxl': { version: 1744936266, format: 'jpg' },
    '2_tcgcin': { version: 1744936266, format: 'jpg' },
    '3_kqvyaz': { version: 1744936266, format: 'jpg' },
    '4_rnrfbc': { version: 1744936266, format: 'jpg' },
    '5_qsofwr': { version: 1744936266, format: 'jpg' },
    
    // Drink-specific images (format: [drink_name][number]_[suffix])
    'Asahi_pint3_utxgcj': { version: 1744937039, format: 'webp' },
    'Tiger_pint1_jwsmgc': { version: 1744937039, format: 'webp' },
    'Heineken_pint2_tbchlz': { version: 1744937039, format: 'webp' }
  };
  
  // Default version and transformation values
  let version = 1744937039; // Most recent version from examples
  let transformationSuffix = 'utxgcj'; // Default suffix
  let format = 'webp'; // Default format
  
  // Create the full image name as it would appear in your Cloudinary (without version)
  const imageName = `${formattedDrinkName}${imageIndex}`;
  
  // Check if we have a known transformation for this drink+index combination
  const specificImage = Object.keys(knownImageTransformations).find(key => 
    key.startsWith(imageName) || key.startsWith(`${imageIndex}_`));
  
  if (specificImage) {
    // Use the known values for this image
    version = knownImageTransformations[specificImage].version;
    format = knownImageTransformations[specificImage].format;
    
    // Use the full specific image name including its transformation
    const imageUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/v${version}/${specificImage}.${format}`;
    console.log(`Using known image URL: ${imageUrl}`);
    return imageUrl;
  }
  
  // For other drinks, construct the URL based on your shared example format:
  // https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744937039/Asahi_pint3_utxgcj.webp
  const randomSuffixes = ['utxgcj', 'jwsmgc', 'tbchlz', 'rnrfbc', 'qsofwr'];
  const randomSuffix = randomSuffixes[Math.floor(Math.random() * randomSuffixes.length)];
  
  const imageUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/v${version}/${formattedDrinkName}${imageIndex}_${randomSuffix}.${format}`;
  
  console.log(`Generated Cloudinary URL: ${imageUrl}`);
  
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
  
  // Use a generic drink image as fallback
  // We'll use jpg format as our primary extension since that works reliably with our Tiger Pint test
  return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,g_auto,h_${height},w_${width}/defaults/generic_drink.jpg`;
}

/**
 * Get a drink category image URL
 */
export function getDrinkCategoryImageUrl(category: string, width: number = 400, height: number = 400): string {
  if (!category) {
    return getDefaultDrinkImageUrl(width, height);
  }
  
  const categoryKey = category.toLowerCase().replace(/[^\w\s]/g, '').trim().replace(/\s+/g, '_');
  
  return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,g_auto,h_${height},w_${width}/categories/${categoryKey}.jpg`;
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