/**
 * Centralized Cloudflare configuration
 * Provides a single source of truth for Cloudflare-related configuration
 */

// The Cloudflare account ID is the unique identifier for the Cloudflare account
// It's used in image URLs and API requests
// Using the actual account ID from the environment variables
export const CLOUDFLARE_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID as string;

// Add a cache to store recently uploaded images by category
const categoryImageCache = new Map<string, string[]>();

// Add a function to get real image IDs for a specific category
export function getCategoryImages(category: string): string[] {
  // First check if we have any cached images for this category
  const cachedImages = categoryImageCache.get(category);
  if (cachedImages && cachedImages.length > 0) {
    return cachedImages;
  }
  
  // If not in the cache, return an empty array
  return [];
}

// Add a function to store an image ID for a category
export function addImageToCategory(category: string, imageId: string) {
  const existingImages = categoryImageCache.get(category) || [];
  categoryImageCache.set(category, [...existingImages, imageId]);
  // Save to local storage for persistence
  try {
    localStorage.setItem('categoryImages', JSON.stringify(Array.from(categoryImageCache.entries())));
  } catch (e) {
    console.warn('Failed to save category images to local storage', e);
  }
}

// Load cached images from local storage on initialization
try {
  const storedCache = localStorage.getItem('categoryImages');
  if (storedCache) {
    const parsedCache = JSON.parse(storedCache);
    for (const [category, images] of parsedCache) {
      categoryImageCache.set(category, images);
    }
  }
} catch (e) {
  console.warn('Failed to load category images from local storage', e);
}

// Generate an image delivery URL for a given image ID and variant
export function getCloudflareImageUrl(
  imageId: string, 
  variant: string = 'public',
  width?: number,
  height?: number
): string {
  // Base URL format
  let url = `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_ID}/${imageId}/${variant}`;
  
  // Add dimensions if provided
  if (width || height) {
    const params = [];
    if (width) params.push(`width=${width}`);
    if (height) params.push(`height=${height}`);
    url += `?${params.join('&')}${params.length > 0 ? '&fit=cover' : ''}`;
  }
  
  return url;
}

/**
 * Check if an image exists and is ready to be displayed
 * Returns the image status and success flag
 */
export async function checkImageStatus(imageId: string): Promise<{success: boolean, status: number}> {
  try {
    // Use the server proxy endpoint to avoid CORS issues
    const response = await fetch(`/api/cloudflare/images/${imageId}/check`);
    
    // Parse the JSON response if available
    let success = response.status === 200;
    if (response.status === 200) {
      try {
        const data = await response.json();
        success = !!data.success;
      } catch (e) {
        // If JSON parsing fails, just use the HTTP status
        console.warn(`Failed to parse JSON response for image ${imageId}:`, e);
      }
    }
    
    return {
      success,
      status: response.status
    };
  } catch (error) {
    console.error(`Error checking image status for ${imageId}:`, error);
    return {
      success: false,
      status: 500
    };
  }
}