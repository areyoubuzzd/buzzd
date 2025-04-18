import fetch from 'node-fetch';

// Environment validation
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN;

if (!ACCOUNT_ID || !API_TOKEN) {
  console.warn('⚠️ Missing Cloudflare Images credentials in environment variables. Some image functionality may not work properly.');
}

// Simple rate limiting mechanism
const API_RATE_LIMIT = {
  maxRequests: 5, // Maximum requests in the time window
  windowMs: 5000, // Time window in milliseconds (5 seconds)
  requests: [] as number[] // Timestamps of recent requests
};

// Check if we're within rate limits and track the request
function checkRateLimit(): boolean {
  const now = Date.now();
  
  // Remove timestamps older than the window
  API_RATE_LIMIT.requests = API_RATE_LIMIT.requests.filter(
    timestamp => now - timestamp < API_RATE_LIMIT.windowMs
  );
  
  // Check if we're at the limit
  if (API_RATE_LIMIT.requests.length >= API_RATE_LIMIT.maxRequests) {
    return false; // Rate limited
  }
  
  // Add the current request timestamp
  API_RATE_LIMIT.requests.push(now);
  return true; // Not rate limited
}

// Get a delay time when rate limited (exponential backoff)
function getRateLimitDelay(retryCount = 0): number {
  const baseDelay = 1000; // 1 second base delay
  const maxDelay = 10000; // 10 seconds max delay
  
  // Simple exponential backoff with jitter
  const exponentialDelay = Math.min(
    maxDelay,
    baseDelay * Math.pow(1.5, retryCount) * (0.9 + Math.random() * 0.2)
  );
  
  return exponentialDelay;
}

// Get an upload URL for direct uploads
export async function getDirectUploadUrl(metadata = {}, retryCount = 0) {
  try {
    if (!ACCOUNT_ID || !API_TOKEN) {
      throw new Error('Cloudflare Images credentials not configured');
    }

    // Check rate limit before making the request
    if (!checkRateLimit()) {
      const delay = getRateLimitDelay(retryCount);
      console.log(`Rate limited, waiting ${delay}ms before retry #${retryCount + 1}`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with incremented retry counter
      return getDirectUploadUrl(metadata, retryCount + 1);
    }

    // Make the API request
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
      // If rate limited, retry with exponential backoff
      if (data.errors?.some((e: any) => e.code === 971)) {
        const delay = getRateLimitDelay(retryCount);
        console.log(`Cloudflare API rate limited, waiting ${delay}ms before retry #${retryCount + 1}`);
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry with incremented retry counter
        return getDirectUploadUrl(metadata, retryCount + 1);
      }
      
      throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
    }
    
    return {
      uploadURL: data.result.uploadURL,
      id: data.result.id
    };
  } catch (error) {
    console.error('Error getting Cloudflare upload URL:', error);
    
    // If we've retried too many times, give up
    if (retryCount >= 5) {
      throw new Error(`Failed to get Cloudflare upload URL after ${retryCount} retries`);
    }
    
    // For network errors, also retry
    const delay = getRateLimitDelay(retryCount);
    console.log(`API request failed, waiting ${delay}ms before retry #${retryCount + 1}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return getDirectUploadUrl(metadata, retryCount + 1);
  }
}

// Get image details
export async function getImageDetails(imageId: string, retryCount = 0) {
  try {
    if (!ACCOUNT_ID || !API_TOKEN) {
      throw new Error('Cloudflare Images credentials not configured');
    }

    // Check rate limit before making the request
    if (!checkRateLimit()) {
      const delay = getRateLimitDelay(retryCount);
      console.log(`Rate limited, waiting ${delay}ms before retry #${retryCount + 1}`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with incremented retry counter
      return getImageDetails(imageId, retryCount + 1);
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
    
    const data = await response.json();
    
    // If rate limited, retry with exponential backoff
    if (!data.success && data.errors?.some((e: any) => e.code === 971)) {
      const delay = getRateLimitDelay(retryCount);
      console.log(`Cloudflare API rate limited, waiting ${delay}ms before retry #${retryCount + 1}`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with incremented retry counter
      return getImageDetails(imageId, retryCount + 1);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching image details for ${imageId}:`, error);
    
    // If we've retried too many times, give up
    if (retryCount >= 5) {
      throw new Error(`Failed to get image details after ${retryCount} retries`);
    }
    
    // For network errors, also retry
    const delay = getRateLimitDelay(retryCount);
    console.log(`API request failed, waiting ${delay}ms before retry #${retryCount + 1}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return getImageDetails(imageId, retryCount + 1);
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