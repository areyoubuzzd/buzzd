import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { analyzeMenu, formatDealsForDatabase } from '../scripts/analyze-menu.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer storage for menu images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/menus');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'menu-' + uniqueSuffix + ext);
  }
});

// Set up multer upload
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size
  },
  fileFilter: function(req, file, cb) {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'));
  }
});

// Create router
const router = express.Router();

// Route for uploading and analyzing a menu
router.post('/upload', upload.single('menuImage'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get establishment ID from request body
    const establishmentId = req.body.establishmentId;
    if (!establishmentId) {
      return res.status(400).json({ error: 'Establishment ID is required' });
    }
    
    const filePath = req.file.path;
    
    // Analyze the menu
    console.log(`Processing menu image: ${filePath}`);
    const analysisResult = await analyzeMenu(filePath);
    
    // Format deals for database
    const formattedDeals = formatDealsForDatabase(analysisResult, parseInt(establishmentId, 10));
    
    // Return the results
    res.json({
      success: true,
      restaurantName: analysisResult.restaurant_name || null,
      originalDeals: analysisResult.deals,
      formattedDeals: formattedDeals,
      filePath: req.file.path
    });
  } catch (error) {
    console.error('Error analyzing menu:', error);
    res.status(500).json({ 
      error: 'Failed to analyze menu',
      details: error.message
    });
  }
});

// Route for saving manually corrected deals to the database
router.post('/save-deals', async (req, res) => {
  try {
    // Get the list of deals to save
    const { deals, establishmentId } = req.body;
    
    if (!deals || !Array.isArray(deals) || deals.length === 0) {
      return res.status(400).json({ error: 'No deals provided' });
    }
    
    if (!establishmentId) {
      return res.status(400).json({ error: 'Establishment ID is required' });
    }
    
    // Connect to the database and insert deals
    const client = await pool.connect();
    const results = { inserted: [], errors: [] };
    
    try {
      await client.query('BEGIN'); // Start transaction
      
      for (const deal of deals) {
        try {
          const query = `
            INSERT INTO deals (
              establishment_id, title, description, status, type, 
              drink_category, drink_subcategory, is_house_pour, brand, serving_style, serving_size,
              regular_price, deal_price, savings_percentage, is_one_for_one,
              start_time, end_time, days_of_week
            ) VALUES (
              $1, $2, $3, $4, $5, 
              $6, $7, $8, $9, $10, $11,
              $12, $13, $14, $15,
              $16, $17, $18
            ) RETURNING id`;
          
          const params = [
            establishmentId,
            deal.title,
            deal.description,
            deal.status || 'active',
            deal.type || 'drink',
            deal.drinkCategory,
            deal.drinkSubcategory,
            deal.isHousePour || false,
            deal.brand,
            deal.servingStyle,
            deal.servingSize,
            deal.regularPrice,
            deal.dealPrice,
            deal.savingsPercentage,
            deal.isOneForOne || false,
            deal.startTime,
            deal.endTime,
            JSON.stringify(deal.daysOfWeek)
          ];
          
          const result = await client.query(query, params);
          results.inserted.push({
            id: result.rows[0].id,
            title: deal.title
          });
        } catch (error) {
          results.errors.push({
            deal: deal.title,
            error: error.message
          });
        }
      }
      
      await client.query('COMMIT'); // Commit transaction
      
      // Return the results
      res.json({
        success: true,
        message: `Successfully inserted ${results.inserted.length} deals`,
        inserted: results.inserted,
        errors: results.errors
      });
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback if any error
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving deals:', error);
    res.status(500).json({ 
      error: 'Failed to save deals',
      details: error.message
    });
  }
});

// Route to list previously uploaded menus
router.get('/uploaded-menus', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads/menus');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      return res.json({ menus: [] });
    }
    
    // Get all files in the directory
    const files = fs.readdirSync(uploadsDir)
      .filter(file => {
        // Filter only image files
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      })
      .map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          path: `/api/menu-analysis/view-menu/${file}`,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by date, newest first
    
    res.json({ menus: files });
  } catch (error) {
    console.error('Error listing uploaded menus:', error);
    res.status(500).json({ 
      error: 'Failed to list uploaded menus',
      details: error.message
    });
  }
});

// Route to view a specific menu
router.get('/view-menu/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/menus', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error viewing menu:', error);
    res.status(500).json({ 
      error: 'Failed to view menu',
      details: error.message
    });
  }
});

// Route to re-analyze a previously uploaded menu
router.post('/reanalyze/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/menus', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    
    // Get establishment ID from request body
    const establishmentId = req.body.establishmentId;
    if (!establishmentId) {
      return res.status(400).json({ error: 'Establishment ID is required' });
    }
    
    // Analyze the menu
    console.log(`Re-analyzing menu image: ${filePath}`);
    const analysisResult = await analyzeMenu(filePath);
    
    // Format deals for database
    const formattedDeals = formatDealsForDatabase(analysisResult, parseInt(establishmentId, 10));
    
    // Return the results
    res.json({
      success: true,
      restaurantName: analysisResult.restaurant_name || null,
      originalDeals: analysisResult.deals,
      formattedDeals: formattedDeals,
      filePath: filePath
    });
  } catch (error) {
    console.error('Error re-analyzing menu:', error);
    res.status(500).json({ 
      error: 'Failed to re-analyze menu',
      details: error.message
    });
  }
});

// Route to delete a menu file
router.delete('/delete-menu/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/menus', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    
    res.json({ success: true, message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(500).json({ 
      error: 'Failed to delete menu',
      details: error.message
    });
  }
});

// Export router
export default router;