/**
 * Local image routes
 * Handles image uploads and serving through Express
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { saveImage, getImageUrl, getRandomImagesForCategory, getImageMetadata } from '../services/local-images';

const router = Router();

// Set up multer for file uploads
const upload = multer({ 
  dest: 'server/uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Only accept image files
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload JPG, PNG, or WebP images only.`));
    }
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload a new image
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    // Get metadata from the request body
    const category = req.body.category || 'general';
    const drinkName = req.body.drinkName;
    
    // Save the image using our local service
    const imageMetadata = await saveImage(file.path, {
      originalName: file.originalname,
      mimeType: file.mimetype,
      category,
      drinkName
    });
    
    // Delete the temporary file
    fs.unlinkSync(file.path);
    
    // Return the image details
    res.json({
      success: true,
      result: {
        id: imageMetadata.id,
        url: imageMetadata.url,
        width: imageMetadata.width,
        height: imageMetadata.height,
        category: imageMetadata.category
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during upload' 
    });
  }
});

// Get image metadata
router.get('/images/:id/metadata', (req: Request, res: Response) => {
  const imageId = req.params.id;
  const metadata = getImageMetadata(imageId);
  
  if (!metadata) {
    return res.status(404).json({
      success: false,
      error: 'Image not found'
    });
  }
  
  res.json({
    success: true,
    result: metadata
  });
});

// Get random images for a category
router.get('/category/:category', (req: Request, res: Response) => {
  const category = req.params.category;
  const count = parseInt(req.query.count as string) || 1;
  
  const imageIds = getRandomImagesForCategory(category, count);
  
  if (imageIds.length === 0) {
    return res.json({
      success: true,
      result: []
    });
  }
  
  // Get metadata for each image
  const images = imageIds.map(id => {
    const metadata = getImageMetadata(id);
    return metadata ? {
      id: metadata.id,
      url: metadata.url,
      width: metadata.width,
      height: metadata.height
    } : null;
  }).filter(Boolean);
  
  res.json({
    success: true,
    result: images
  });
});

export default router;