import { Router, Request, Response } from 'express';
import { getDirectUploadUrl, isConfigured } from '../services/cloudflare-images';

const router = Router();

// Middleware to check if Cloudflare Images is configured
const requireCloudflareConfig = (req: Request, res: Response, next: Function): void => {
  if (!isConfigured()) {
    res.status(503).json({ 
      success: false,
      error: 'Cloudflare Images is not configured. Please add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_IMAGES_API_TOKEN to your environment variables.' 
    });
    return;
  }
  next();
};

// Endpoint to get a direct upload URL from Cloudflare Images
router.post('/api/cloudflare/get-upload-url', requireCloudflareConfig, async (req: Request, res: Response) => {
  try {
    const { category, drinkName, establishmentId, dealId } = req.body;
    
    // Prepare metadata to tag the image
    const metadata = {
      type: 'drink',
      category: category || 'general',
      name: drinkName || 'unnamed',
      establishmentId: establishmentId ? String(establishmentId) : undefined,
      dealId: dealId ? String(dealId) : undefined,
      uploadedAt: new Date().toISOString(),
      uploadMethod: 'direct'
    };
    
    // Get a direct upload URL with metadata
    // This function now has built-in rate limiting and retries
    const { uploadURL, id } = await getDirectUploadUrl(metadata);
    
    if (!uploadURL || !id) {
      throw new Error('Invalid response from Cloudflare - missing upload URL or ID');
    }
    
    res.json({
      success: true,
      uploadURL,
      id,
      metadata
    });
  } catch (error) {
    console.error('Error getting Cloudflare upload URL:', error);
    
    // Provide a more helpful error message to the client
    let errorMessage = 'Failed to get upload URL';
    let statusCode = 500;
    
    // If it's a rate limit issue
    if (error instanceof Error && error.message.includes('rate')) {
      errorMessage = 'Cloudflare API rate limit exceeded. Please try again in a few moments.';
      statusCode = 429; // Too Many Requests
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;