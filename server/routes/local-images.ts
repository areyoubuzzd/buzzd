import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'general';
    const dirPath = path.join(process.cwd(), 'public/images/drinks', category.toLowerCase());
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    cb(null, dirPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique ID for this image
    const imageId = uuidv4();
    
    // Get the file extension
    const ext = path.extname(file.originalname).toLowerCase() || '.jpeg';
    
    // Create filename: uuid + original extension
    cb(null, `${imageId}${ext}`);
  }
});

// Set up the multer middleware
const upload = multer({ 
  storage, 
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Helper to safely parse a category name
function safeCategory(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

// Router endpoint for image upload
router.post('/api/local-images/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    // Get metadata from request
    const category = safeCategory(req.body.category || 'general');
    
    // Extract the image ID from the filename (remove extension)
    const imageId = path.basename(req.file.filename, path.extname(req.file.filename));
    
    // Create the URL to access this image
    const fileExtension = path.extname(req.file.filename);
    const url = `/direct-image/${category}/${imageId}${fileExtension}`;
    
    // Return success response with image details
    res.json({
      success: true,
      result: {
        id: imageId,
        url,
        category,
        path: req.file.path,
        size: req.file.size,
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Router endpoint to list all images by category
router.get('/api/local-images/all', (req, res) => {
  try {
    const baseDir = path.join(process.cwd(), 'public/images/drinks');
    
    // Make sure the directory exists
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    
    // Get all directories (categories)
    const categories = fs.readdirSync(baseDir).filter(item => {
      const itemPath = path.join(baseDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    // Build a map of category -> image IDs
    const imageMap: Record<string, string[]> = {};
    
    categories.forEach(category => {
      const categoryDir = path.join(baseDir, category);
      const files = fs.readdirSync(categoryDir).filter(file => {
        const filePath = path.join(categoryDir, file);
        return fs.statSync(filePath).isFile() && 
               ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(path.extname(file).toLowerCase());
      });
      
      // Extract just the image IDs without extensions
      imageMap[category] = files.map(file => {
        const ext = path.extname(file);
        return path.basename(file, ext);
      });
    });
    
    res.json({
      success: true,
      images: imageMap
    });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;