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
  console.log(`======== getRandomDrinkImageUrl CALLED ========`);
  console.log(`Drink name: "${drinkName}"`);
  console.log(`Max images: ${maxImages}`);
  console.log(`Width: ${width}, Height: ${height}`);
  console.log(`Cloudinary cloud name: ${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'NOT SET'}`);
  
  if (!drinkName) {
    return getDefaultDrinkImageUrl(width, height);
  }

  const formattedName = formatDrinkNameForCloudinary(drinkName);
  
  // Generate a random image index (1-based to match expected naming convention)
  const imageIndex = Math.floor(Math.random() * maxImages) + 1;
  
  // Format the drink name for the folder structure (lowercase, replace spaces with underscores)
  // This allows us to have different folders for "Heineken Pint" and "Heineken Bottle"
  const lowerCaseName = drinkName.toLowerCase();
  const folderName = lowerCaseName.replace(/\s+/g, '_');
  
  // Path to the folder that contains images for this drink type
  // Format: /home/brands/[drink_category]/[specific_drink_name]/[index].jpg
  
  // Determine drink category for folder structure
  let drinkCategory = '';
  
  if (lowerCaseName.includes('pint') || 
      lowerCaseName.includes('beer') || 
      lowerCaseName.includes('bottle') || 
      lowerCaseName.includes('heineken') ||
      lowerCaseName.includes('tiger') ||
      lowerCaseName.includes('sapporo') ||
      lowerCaseName.includes('carlsberg')) {
    drinkCategory = 'beer';
  } else if (lowerCaseName.includes('wine')) {
    drinkCategory = 'wine';
  } else if (lowerCaseName.includes('cocktail') || 
             lowerCaseName.includes('margarita') || 
             lowerCaseName.includes('mojito')) {
    drinkCategory = 'cocktail';
  } else if (lowerCaseName.includes('whisky') || 
             lowerCaseName.includes('whiskey') ||
             lowerCaseName.includes('chivas') ||
             lowerCaseName.includes('singleton')) {
    drinkCategory = 'whisky';
  } else if (lowerCaseName.includes('gin')) {
    drinkCategory = 'gin';
  } else if (lowerCaseName.includes('vodka')) {
    drinkCategory = 'vodka';
  } else if (lowerCaseName.includes('rum')) {
    drinkCategory = 'rum';
  } else {
    // Default to spirits if we can't determine a category
    drinkCategory = 'spirits';
  }
  
  // Build multiple possible image paths using different extensions
  // Since Cloudinary seems to convert our images to SVG format, we'll try SVG first, 
  // then fall back to jpg and jpeg if needed
  const imagePathSvg = `home/brands/${drinkCategory}/${folderName}/${imageIndex}.svg`;
  const imagePathJpg = `home/brands/${drinkCategory}/${folderName}/${imageIndex}.jpg`;
  const imagePathJpeg = `home/brands/${drinkCategory}/${folderName}/${imageIndex}.jpeg`;
  
  // Based on user feedback, the actual URLs are in a different format:
  // https://res.cloudinary.com/dp2uoj3ts/image/upload/v1744936265/2.jpg
  // They don't include the folder structure we expected but use a version number

  // First, try using the version-based format that the user confirmed is working
  // We'll use version numbers close to what we've seen work
  const version = Math.floor(1744936160 + (Math.random() * 200)); // Version around known working range
  const versionUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/v${version}/${imageIndex}.jpg`;
  
  console.log(`Drink: ${drinkName}`);
  console.log(`Category: ${drinkCategory}`);
  console.log(`Folder name: ${folderName}`);
  console.log(`Image index: ${imageIndex}`);
  console.log(`Using direct version-based URL format: ${versionUrl}`);
  
  return versionUrl;
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