import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cloudinaryUploader from '../utils/cloudinaryUploader';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use original filename with timestamp to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

const router = express.Router();

// Test Cloudinary connection
router.get('/api/cloudinary/test', async (req, res) => {
  try {
    const isConnected = await cloudinaryUploader.testConnection();
    res.json({ success: isConnected });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get folder structure
router.get('/api/cloudinary/structure', (req, res) => {
  try {
    const structure = cloudinaryUploader.getFolderStructure();
    res.json(structure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload background image
router.post('/api/cloudinary/background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    
    const result = await cloudinaryUploader.uploadBackgroundImage(req.file.path, category);
    
    // Clean up the local file
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload brand image
router.post('/api/cloudinary/brand', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const { category, brandName, servingStyle } = req.body;
    
    if (!category || !brandName) {
      return res.status(400).json({ error: 'Category and brand name are required' });
    }
    
    const result = await cloudinaryUploader.uploadBrandImage(
      req.file.path, 
      category, 
      brandName, 
      servingStyle || 'bottle'
    );
    
    // Clean up the local file
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload cocktail image
router.post('/api/cloudinary/cocktail', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const { cocktailName } = req.body;
    
    if (!cocktailName) {
      return res.status(400).json({ error: 'Cocktail name is required' });
    }
    
    const result = await cloudinaryUploader.uploadCocktailImage(req.file.path, cocktailName);
    
    // Clean up the local file
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload restaurant logo
router.post('/api/cloudinary/restaurant', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const { restaurantId } = req.body;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }
    
    const result = await cloudinaryUploader.uploadRestaurantLogo(req.file.path, restaurantId);
    
    // Clean up the local file
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload default image
router.post('/api/cloudinary/default', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const { type, category } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Type is required' });
    }
    
    const result = await cloudinaryUploader.uploadDefaultImage(req.file.path, type, category || null);
    
    // Clean up the local file
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;