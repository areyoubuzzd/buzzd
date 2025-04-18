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
    
    // Use an alternative approach for the upload
    const uploadFormData = new URLSearchParams();
    const fileBase64 = fileData.toString('base64');
    uploadFormData.append('file', `data:${req.file.mimetype};base64,${fileBase64}`);
    
    console.log(`Uploading file to Cloudflare using URL: ${uploadURL}`);
    
    // Upload the file to Cloudflare Images using the direct upload URL
    const uploadResponse = await fetch(uploadURL, {
      method: 'POST',
      body: uploadFormData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
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