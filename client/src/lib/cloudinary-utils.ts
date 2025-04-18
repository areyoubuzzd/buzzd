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

  // Known existing Cloudinary images (exact URLs that are confirmed to work)
  const knownDrinkImages: Record<string, string[]> = {
    'asahi pint': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744937039/Asahi_pint3_utxgcj.webp',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744937038/Asahi_pint2_vdhjk5.jpg'
    ],
    'tiger pint': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744937039/Tiger_pint1_jwsmgc.webp',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744936266/4_rnrfbc.jpg'
    ],
    'heineken pint': [
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744937039/Heineken_pint2_tbchlz.webp',
      'https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744936265/heineken_pint_2.jpg'
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
  
  // For unknown drinks, we'll try to make a reasonable guess based on your examples
  const formattedDrinkName = formatDrinkNameForCloudinary(drinkName);
  const randomIndex = getUniqueRandomIndex(lowerDrinkName, maxImages);
  
  // We've seen several different URL formats in your Cloudinary account:
  // Format 1: https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744937039/Asahi_pint3_utxgcj.webp
  // Format 2: https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744936265/heineken_pint_2.jpg
  
  // Choose between the different version numbers we've seen
  const versions = [1744937039, 1744936265, 1744937038];
  const version = versions[Math.floor(Math.random() * versions.length)];
  
  // Randomly choose URL format style
  const urlFormats = ['drink_index_suffix', 'drink_index'];
  const urlFormatStyle = urlFormats[Math.floor(Math.random() * urlFormats.length)];
  
  // For format with suffixes
  const suffixes = ['utxgcj', 'vdhjk5', 'jwsmgc', 'tbchlz', 'rnrfbc', 'qsofwr'];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  // We've seen both capitalized and lowercase versions
  const capitalizedName = formattedDrinkName.charAt(0).toUpperCase() + formattedDrinkName.slice(1);
  const useLowercase = Math.random() > 0.5;
  const finalName = useLowercase ? formattedDrinkName : capitalizedName;
  
  // Randomly use either jpg or webp format
  const formats = ['jpg', 'webp'];
  const format = formats[Math.floor(Math.random() * formats.length)];
  
  // Construct URL based on chosen format style
  let imageUrl;
  if (urlFormatStyle === 'drink_index_suffix') {
    // Format 1: With suffix (Asahi_pint3_utxgcj.webp)
    imageUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/v${version}/${finalName}${randomIndex}_${randomSuffix}.${format}`;
  } else {
    // Format 2: Without suffix (heineken_pint_2.jpg)
    imageUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/v${version}/${finalName}_${randomIndex}.${format}`;
  }
  
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