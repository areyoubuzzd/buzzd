import fetch from 'node-fetch';

// Environment validation
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN;

if (!ACCOUNT_ID || !API_TOKEN) {
  console.warn('⚠️ Missing Cloudflare Images credentials in environment variables. Some image functionality may not work properly.');
}

// Get an upload URL for direct uploads
export async function getDirectUploadUrl(metadata = {}) {
  try {
    if (!ACCOUNT_ID || !API_TOKEN) {
      throw new Error('Cloudflare Images credentials not configured');
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requireSignedURLs: false,
          metadata
        })
      }
    );
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
    }
    
    return {
      uploadURL: data.result.uploadURL,
      id: data.result.id
    };
  } catch (error) {
    console.error('Error getting Cloudflare upload URL:', error);
    throw error;
  }
}

// Get image details
export async function getImageDetails(imageId: string) {
  try {
    if (!ACCOUNT_ID || !API_TOKEN) {
      throw new Error('Cloudflare Images credentials not configured');
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1/${imageId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        }
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching image details for ${imageId}:`, error);
    throw error;
  }
}

// Delete an image
export async function deleteImage(imageId: string) {
  try {
    if (!ACCOUNT_ID || !API_TOKEN) {
      throw new Error('Cloudflare Images credentials not configured');
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        }
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting image ${imageId}:`, error);
    throw error;
  }
}

// List images
export async function listImages(page = 1, perPage = 100) {
  try {
    if (!ACCOUNT_ID || !API_TOKEN) {
      throw new Error('Cloudflare Images credentials not configured');
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1?page=${page}&per_page=${perPage}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        }
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error('Error listing images:', error);
    throw error;
  }
}

// Get URL for an image with optional transformations
export function getImageUrl(imageId: string, variant = 'public') {
  if (!ACCOUNT_ID) {
    // Return a fallback when not configured
    console.warn(`⚠️ Cloudflare Images not configured, using fallback for image: ${imageId}`);
    return `/static/images/fallback.jpg`;
  }
  
  // Format for Cloudflare Images URLs
  return `https://imagedelivery.net/${ACCOUNT_ID}/${imageId}/${variant}`;
}

// Check if Cloudflare Images is configured
export function isConfigured() {
  return !!(ACCOUNT_ID && API_TOKEN);
}

// Debug connection
export async function checkConnection() {
  try {
    if (!ACCOUNT_ID || !API_TOKEN) {
      return { success: false, message: 'Cloudflare Images credentials not configured' };
    }
    
    // Try to list images as a connection test
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1?page=1&per_page=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, message: 'Connection to Cloudflare Images successful' };
    } else {
      return { success: false, message: `Connection failed: ${JSON.stringify(data.errors)}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Unknown error';
    return { success: false, message: `Connection error: ${errorMessage}` };
  }
}