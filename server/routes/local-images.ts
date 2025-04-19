/**
 * Routes for local image uploads
 * A simpler alternative to Cloudflare Images
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { saveImage, getImageUrl, getRandomImagesForCategory } from '../services/local-images';

const router = Router();

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'server', 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname) || '.jpg';
    
    cb(null, uniqueSuffix + fileExtension);
  }
});

// Create the multer instance
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept specific image types
    const allowedMimeTypes = [
      'image/jpeg', 
      'image/png',
      'image/webp',
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not supported. Supported formats: JPG, PNG, WebP`));
    }
  }
});

/**
 * Upload an image
 * 
 * POST /api/local/upload
 * 
 * Accepts multipart form data with:
 * - file: The image file
 * - category: Optional category for the image
 * - drinkName: Optional drink name
 * - type: Optional type (drink, establishment, etc.)
 * 
 * Returns the image metadata with URL
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    // Extract metadata from request
    const category = req.body.category || 'general';
    const drinkName = req.body.drinkName;
    
    // Save the image and get metadata (includes URL)
    const imageMetadata = await saveImage(file.path, {
      category,
      drinkName,
      originalName: file.originalname,
      mimeType: file.mimetype
    });
    
    // Remove temporary file
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
    
    // Return image metadata with success status
    return res.status(200).json({
      success: true,
      result: {
        id: imageMetadata.id,
        url: imageMetadata.url,
        metadata: {
          category,
          drinkName,
        }
      }
    });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get image information
 * 
 * GET /api/local/images/:id
 * 
 * Returns information about the image
 */
router.get('/images/:id', (req: Request, res: Response) => {
  const imageId = req.params.id;
  
  // Get image URL (also verifies image exists)
  const imageUrl = getImageUrl(imageId);
  
  if (!imageUrl) {
    return res.status(404).json({
      success: false,
      error: 'Image not found'
    });
  }
  
  return res.json({
    success: true,
    result: {
      id: imageId,
      url: imageUrl
    }
  });
});

/**
 * Get random image for a category
 * 
 * GET /api/local/random/:category
 * 
 * Returns a random image from the specified category
 */
router.get('/random/:category', (req: Request, res: Response) => {
  const category = req.params.category;
  
  // Get random image ID for the category
  const imageIds = getRandomImagesForCategory(category, 1);
  
  if (imageIds.length === 0) {
    return res.status(404).json({
      success: false,
      error: `No images found for category "${category}"`
    });
  }
  
  const imageId = imageIds[0];
  const imageUrl = getImageUrl(imageId);
  
  return res.json({
    success: true,
    result: {
      id: imageId,
      url: imageUrl
    }
  });
});

export default router;