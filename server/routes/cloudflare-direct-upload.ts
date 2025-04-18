import { Router, Request, Response } from 'express';
import { getDirectUploadUrl } from '../services/cloudflare-images';

const router = Router();

// Endpoint to get a direct upload URL from Cloudflare Images
router.post('/api/cloudflare/get-upload-url', async (req: Request, res: Response) => {
  try {
    const { category, drinkName, establishmentId, dealId } = req.body;
    
    // Prepare metadata to tag the image
    const metadata = {
      type: 'drink',
      category: category || 'general',
      name: drinkName || 'unnamed',
      establishmentId: establishmentId ? String(establishmentId) : undefined,
      dealId: dealId ? String(dealId) : undefined,
      uploadedAt: new Date().toISOString()
    };
    
    // Get a direct upload URL with metadata
    const { uploadURL, id } = await getDirectUploadUrl(metadata);
    
    res.json({
      success: true,
      uploadURL,
      id,
      metadata
    });
  } catch (error) {
    console.error('Error getting Cloudflare upload URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Cloudflare upload URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;