import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import { 
  getDirectUploadUrl, 
  deleteImage, 
  getImageDetails, 
  checkConnection, 
  isConfigured 
} from '../services/cloudflare-images';

const router = Router();

// Configure storage for multer (temporary storage before uploading to Cloudflare)
const storage = multer.diskStorage({
  destination: 'server/uploads/',
  filename: (_req, file, cb) => {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = file.originalname.split('.').pop();
    cb(null, uniqueSuffix + '.' + fileExtension);
  }
});

// Create the multer instance
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept specific image types that Cloudflare supports
    const allowedMimeTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'image/avif',
      'image/svg+xml'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not supported. Supported formats: JPG, PNG, GIF, WebP, AVIF, SVG`));
    }
  }
});

// Create the uploads directory if it doesn't exist
if (!fs.existsSync('server/uploads')) {
  fs.mkdirSync('server/uploads', { recursive: true });
}

// Middleware to check if Cloudflare Images is configured
const requireCloudflareConfig = (req: Request, res: Response, next: NextFunction): void => {
  if (!isConfigured()) {
    res.status(503).json({ 
      error: 'Cloudflare Images is not configured. Please add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_IMAGES_API_TOKEN to your environment variables.' 
    });
    return;
  }
  next();
};

// Get a direct upload URL for client-side uploads to Cloudflare Images
router.post('/api/cloudflare/direct-upload', requireCloudflareConfig, async (req: Request, res: Response) => {
  try {
    const { type, category, drinkName, establishmentId, dealId } = req.body;
    
    // Prepare metadata to tag the image
    const metadata = {
      type: type || 'drink',
      category: category || 'general',
      name: drinkName || 'unnamed',
      establishmentId: establishmentId ? String(establishmentId) : undefined,
      dealId: dealId ? String(dealId) : undefined,
      uploadedAt: new Date().toISOString()
    };
    
    const uploadData = await getDirectUploadUrl(metadata);
    res.json(uploadData);
  } catch (error) {
    console.error('Error generating direct upload URL:', error);
    res.status(500).json({ 
      error: 'Failed to get upload URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload an image file through server-side upload
router.post('/api/cloudflare/upload', requireCloudflareConfig, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const { type, category, drinkName, establishmentId, dealId } = req.body;
    
    // Prepare metadata to tag the image
    const metadata = {
      type: type || 'drink',
      category: category || 'general',
      name: drinkName || 'unnamed',
      establishmentId: establishmentId ? String(establishmentId) : undefined,
      dealId: dealId ? String(dealId) : undefined,
      uploadedAt: new Date().toISOString(),
      uploadMethod: 'server'
    };
    
    // Get a direct upload URL with metadata
    const { uploadURL, id } = await getDirectUploadUrl(metadata);
    
    // Create form data for upload
    const formData = new FormData();
    
    // We'll use fetch's automatic handling of FormData with files
    // Create a simple form with the file and convert directly to a buffer
    const fileData = fs.readFileSync(req.file.path);
    
    // Log file information for debugging
    console.log(`File details: size=${fileData.length} bytes, mime=${req.file.mimetype}, name=${req.file.originalname}`);
    
    // Create a FormData object for multipart/form-data upload
    // This is the format Cloudflare expects for direct uploads
    const uploadFormData = new FormData();
    
    // Create a Blob from the buffer with the correct MIME type
    const blob = new Blob([fileData], { type: req.file.mimetype });
    
    // Append the file to FormData - IMPORTANT: the field name must be 'file'
    uploadFormData.append('file', blob, req.file.originalname);
    
    console.log(`Uploading file to Cloudflare using URL: ${uploadURL}`);
    console.log(`Uploading as ${req.file.mimetype}, size: ${fileData.length} bytes`);
    
    // Upload the file to Cloudflare Images using the direct upload URL
    const uploadResponse = await fetch(uploadURL, {
      method: 'POST',
      body: uploadFormData,
      // Don't set Content-Type - let fetch set the correct multipart boundary
    });
    
    // Delete the temporary file regardless of success/failure
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (!uploadResponse.ok) {
      const responseText = await uploadResponse.text();
      console.error(`Cloudflare upload failed with status ${uploadResponse.status}: ${responseText}`);
      throw new Error(`Cloudflare upload failed: ${uploadResponse.statusText}`);
    }
    
    // For simplicity, we'll just return the ID since the actual upload already happened
    res.json({ 
      success: true, 
      result: { 
        id: id,
        variants: ["public", "thumbnail"]
      } 
    });
  } catch (error) {
    console.error('Error uploading to Cloudflare Images:', error);
    
    // Delete the temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to upload image to Cloudflare Images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete an image
router.delete('/api/cloudflare/images/:id', requireCloudflareConfig, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteImage(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get image details
router.get('/api/cloudflare/images/:id', requireCloudflareConfig, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await getImageDetails(id);
    res.json(result);
  } catch (error) {
    console.error('Error fetching image details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch image details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check if an image is available (for newly uploaded images)
router.get('/api/cloudflare/images/:id/check', requireCloudflareConfig, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    
    if (!accountId) {
      return res.status(500).json({ 
        error: 'Cloudflare account ID not configured'
      });
    }
    
    // Try to get the image details from Cloudflare (with built-in rate limiting and retries)
    try {
      const imageDetails = await getImageDetails(id);
      
      // Check if we got a valid response
      if (!imageDetails.success) {
        // If we get an error that's not a 404, assume the image is still processing
        return res.status(202).json({ 
          success: false, 
          message: 'Image is being processed or not yet available',
          details: imageDetails.errors ? JSON.stringify(imageDetails.errors) : 'Unknown error'
        });
      }
      
      // If we get here, the image exists in Cloudflare's database
      // Now check if the delivery URL is accessible
      const imageUrl = `https://imagedelivery.net/${accountId}/${id}/public`;
      
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        
        if (response.ok) {
          // Image is fully processed and available
          return res.status(200).json({ 
            success: true, 
            message: 'Image is available',
            url: imageUrl 
          });
        } else {
          // Image is in Cloudflare's database but not fully processed yet
          return res.status(202).json({ 
            success: false, 
            message: 'Image is being processed',
            status: response.status
          });
        }
      } catch (fetchError) {
        // If we can't fetch the image, it's likely still processing
        return res.status(202).json({ 
          success: false, 
          message: 'Image is being processed',
          details: fetchError instanceof Error ? fetchError.message : 'Error checking image availability'
        });
      }
    } catch (detailsError) {
      // Rate limit errors would be caught by the retries in getImageDetails
      // So this is likely a real error or the image doesn't exist
      console.error('Error getting image details:', detailsError);
      
      // For consistent user experience, still report as "processing" rather than an error
      return res.status(202).json({ 
        success: false, 
        message: 'Image is being processed or not yet available',
        details: detailsError instanceof Error ? detailsError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error checking image availability:', error);
    
    // For consistent user experience, don't expose server errors to the client
    res.status(202).json({ 
      success: false, 
      message: 'Image is being processed',
      details: 'An error occurred while checking image status'
    });
  }
});

// Check Cloudflare Images connection
router.get('/api/cloudflare/connection', async (req: Request, res: Response) => {
  try {
    const result = await checkConnection();
    res.json(result);
  } catch (error) {
    console.error('Error checking Cloudflare Images connection:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;