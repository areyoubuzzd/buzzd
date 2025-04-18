/**
 * Centralized Cloudflare configuration
 * Provides a single source of truth for Cloudflare-related configuration
 */

// The Cloudflare account ID is the unique identifier for the Cloudflare account
// It's used in image URLs and API requests
export const CLOUDFLARE_ACCOUNT_ID = "kx7S-b2sJYbGgWyc5FfQUg";

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

// Check if an image exists and is ready to be displayed
export async function checkImageStatus(imageId: string): Promise<{success: boolean, status: number}> {
  try {
    // Use the server proxy endpoint to avoid CORS issues
    const response = await fetch(`/api/cloudflare/images/${imageId}/check`);
    return {
      success: response.status === 200,
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