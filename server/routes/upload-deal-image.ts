import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const router = Router();

// Configure storage for multer
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
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create the uploads directory if it doesn't exist
if (!fs.existsSync('server/uploads')) {
  fs.mkdirSync('server/uploads', { recursive: true });
}

// Route to handle image uploads
router.post('/api/upload-deal-image', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const { type, category, brand, servingStyle } = req.body;
    
    // Validate required fields
    if (!type || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Determine the folder path in Cloudinary
    let folderPath;
    if (type === 'background') {
      folderPath = `home/backgrounds/${category}`;
    } else if (type === 'hero') {
      if (!brand || !servingStyle) {
        return res.status(400).json({ error: 'Missing brand or serving style for hero image' });
      }
      folderPath = `home/brands/${category}/${brand}/${servingStyle}`;
    } else {
      return res.status(400).json({ error: 'Invalid upload type' });
    }
    
    // Upload the file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: folderPath,
      resource_type: 'image',
    });
    
    // Delete the temporary file
    fs.unlinkSync(req.file.path);
    
    // Return the Cloudinary upload result
    res.json(uploadResult);
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    
    // Delete the temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to upload image to Cloudinary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;