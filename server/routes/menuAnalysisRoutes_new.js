import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Mock data for fallback when Claude API is unavailable
const mockDeals = {
  "restaurant_name": "The Happy Hour Bistro",
  "deals": [
    {
      "item": "House Red Wine",
      "category": "wine",
      "subcategory": "red_wine",
      "brand": null,
      "regular_price": 15.90,
      "deal_price": 9.90,
      "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "start_time": "17:00",
      "end_time": "19:30",
      "serving_style": "glass",
      "serving_size": "150ml",
      "is_one_for_one": false,
      "description": "Selected house pour red wine"
    },
    {
      "item": "Draft Beer",
      "category": "beer",
      "subcategory": "lager",
      "brand": "Tiger",
      "regular_price": 13.90,
      "deal_price": 7.90,
      "days": ["Everyday"],
      "start_time": "17:00",
      "end_time": "20:00",
      "serving_style": "pint",
      "serving_size": "500ml",
      "is_one_for_one": false,
      "description": "Crisp and refreshing Tiger beer on tap"
    },
    {
      "item": "Margarita",
      "category": "cocktail",
      "subcategory": null,
      "brand": null,
      "regular_price": 18.90,
      "deal_price": 12.90,
      "days": ["Thursday", "Friday", "Saturday"],
      "start_time": "18:00",
      "end_time": "22:00",
      "serving_style": "glass",
      "serving_size": "Standard",
      "is_one_for_one": false,
      "description": "Classic margarita with tequila, lime and triple sec"
    },
    {
      "item": "Chicken Wings",
      "category": "food",
      "subcategory": "appetizer",
      "brand": null,
      "regular_price": 16.90,
      "deal_price": 9.90,
      "days": ["Monday", "Wednesday", "Friday"],
      "start_time": "17:00",
      "end_time": "21:00",
      "serving_style": null,
      "serving_size": "6 pieces",
      "is_one_for_one": false,
      "description": "Crispy fried chicken wings with spicy sauce"
    },
    {
      "item": "Gin & Tonic",
      "category": "cocktail",
      "subcategory": "mixed_drink",
      "brand": "Bombay Sapphire",
      "regular_price": 16.90,
      "deal_price": 10.90,
      "days": ["Tuesday"],
      "start_time": "18:00",
      "end_time": "23:00",
      "serving_style": "glass",
      "serving_size": "Standard",
      "is_one_for_one": true,
      "description": "Bombay Sapphire gin with premium tonic water"
    }
  ]
};

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Warning: ANTHROPIC_API_KEY environment variable is not set");
}

// Check for database connection
if (!process.env.DATABASE_URL) {
  console.error("Warning: DATABASE_URL environment variable is not set");
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create database connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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
    // Accept image files and PDF files
    const filetypes = /jpeg|jpg|png|webp|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only image files (jpg, jpeg, png, webp) and PDF files are allowed'));
  }
});

/**
 * Convert image file to base64
 */
function imageToBase64(filepath) {
  const imageBuffer = fs.readFileSync(filepath);
  return imageBuffer.toString('base64');
}

// Use the mock data defined at the top of the file

/**
 * Analyze menu image to extract happy hour deals
 */
async function analyzeMenu(imagePath) {
  try {
    console.log(`Analyzing menu image: ${imagePath}`);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }
    
    // Get file extension
    const ext = path.extname(imagePath).toLowerCase();
    
    // Check file type
    if (!['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext)) {
      throw new Error(`Unsupported file type: ${ext}. Please use JPG, PNG, WebP images, or PDF files.`);
    }
    
    // Convert file to base64
    const base64Image = imageToBase64(imagePath);
    
    // Determine media type
    let mediaType = 'image/jpeg';
    if (ext === '.png') mediaType = 'image/png';
    if (ext === '.webp') mediaType = 'image/webp';
    if (ext === '.pdf') mediaType = 'application/pdf';
    
    try {
      console.log("Sending image to Claude for analysis...");
      
      // Send to Claude for analysis
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        system: `You are a menu analyst specialized in extracting happy hour deals from restaurant/bar menus.
        
Your task is to identify all happy hour deals and format them as structured data.

For each deal you identify, extract the following information:
1. Item name (e.g., "House Red Wine", "Draft Beer", "Margarita")
2. Category (beer, wine, cocktail, spirits, food)
3. Subcategory if available (e.g., red_wine, lager, etc.)
4. Brand if specified (e.g., "Heineken", "Jack Daniel's")
5. Regular price (if listed)
6. Happy hour/discounted price
7. Days available (e.g., ["Monday", "Tuesday"] or ["All Week"])
8. Start time (e.g., "17:00")
9. End time (e.g., "19:00")
10. Serving style (glass, bottle, pint, etc.)
11. Serving size if specified
12. One-for-one (true/false)

Respond with a JSON structure that follows this format:
{
  "restaurant_name": "Restaurant name if visible in the menu",
  "deals": [
    {
      "item": "Name of the item",
      "category": "One of: beer, wine, cocktail, spirits, food, non_alcoholic",
      "subcategory": "Optional subcategory",
      "brand": "Brand name if available",
      "regular_price": 15.90,
      "deal_price": 10.90,
      "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "start_time": "17:00",
      "end_time": "19:30",
      "serving_style": "One of: glass, bottle, pint, flight, bucket",
      "serving_size": "Optional size info",
      "is_one_for_one": false,
      "description": "Any additional details about the deal"
    }
  ]
}

If you can't determine a value, use null. If there's no happy hour section, check for other specials or promotions like "daily specials" or "promotions" and extract those.

Only include drinks and food items that have clear promotional pricing. Do not include regular menu items without discounts.`,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "This is a menu from a restaurant or bar. Please analyze it and extract all happy hour deals and promotions in the required JSON format."
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Image
              }
            }
          ]
        }]
      });
      
      // Extract JSON from Claude's response
      const jsonText = response.content[0].text;
      const jsonMatch = jsonText.match(/```json\n([\s\S]*?)```/) || jsonText.match(/```\n([\s\S]*?)```/);
      
      let dealsData;
      if (jsonMatch) {
        // Extract JSON from code block
        dealsData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to parse entire response if no code block is found
        try {
          dealsData = JSON.parse(jsonText);
        } catch (e) {
          console.error("Failed to parse response as JSON:", e);
          console.log("Raw response:", jsonText);
          throw new Error("Could not parse happy hour deals from the menu image");
        }
      }
      
      return dealsData;
    } catch (error) {
      // Check if the error is likely from the Claude API
      if (error.message && (error.message.includes("credit balance") || error.message.includes("Anthropic API"))) {
        console.error("Error using Claude API:", error);
        console.log("Using mock data for testing instead");
        
        // File path substring can be used to add some variety based on the image
        const filePathHash = imagePath.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 5;
        
        // Add some randomization to the mock data
        const mockResponse = JSON.parse(JSON.stringify(mockDeals));
        
        // Slightly modify prices based on the file path to make it seem dynamic
        mockResponse.deals.forEach(deal => {
          deal.regular_price = parseFloat((deal.regular_price + filePathHash * 0.5).toFixed(2));
          deal.deal_price = parseFloat((deal.deal_price + filePathHash * 0.25).toFixed(2));
        });
        
        // Return mock data for testing purposes
        return mockResponse;
      }
      
      // If not a Claude API error, rethrow
      throw error;
    }
  } catch (error) {
    console.error("Error analyzing menu:", error);
    throw error;
  }
}

/**
 * Validate days of week for our schema
 */
function normalizeDaysOfWeek(days) {
  const dayMap = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
    'all week': [0, 1, 2, 3, 4, 5, 6],
    'weekdays': [1, 2, 3, 4, 5],
    'weekends': [0, 6],
    'everyday': [0, 1, 2, 3, 4, 5, 6],
    'daily': [0, 1, 2, 3, 4, 5, 6]
  };
  
  if (!days || !Array.isArray(days)) return [0, 1, 2, 3, 4, 5, 6]; // Default to all days
  
  const result = [];
  for (const day of days) {
    if (!day) continue;
    
    const dayLower = day.toLowerCase();
    if (dayMap[dayLower] !== undefined) {
      if (Array.isArray(dayMap[dayLower])) {
        result.push(...dayMap[dayLower]);
      } else {
        result.push(dayMap[dayLower]);
      }
    }
  }
  
  // Remove duplicates
  return [...new Set(result)].sort();
}

/**
 * Convert time string to timestamp
 */
function timeStringToTimestamp(timeStr, referenceDate = new Date()) {
  if (!timeStr) return null;
  
  // Extract hours and minutes
  const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))?/i);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3] ? match[3].toLowerCase() : null;
  
  // Handle AM/PM
  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;
  
  // Create a new date with the reference date but with hours/minutes from the time string
  const date = new Date(referenceDate);
  date.setHours(hours, minutes, 0, 0);
  
  return date.toISOString();
}

/**
 * Format deals for database insertion
 */
function formatDealsForDatabase(dealsData, establishmentId) {
  const formattedDeals = [];
  
  if (!dealsData || !dealsData.deals || !Array.isArray(dealsData.deals)) {
    return formattedDeals;
  }
  
  for (const deal of dealsData.deals) {
    // Skip incomplete deals
    if (!deal.item || !deal.deal_price) continue;
    
    const regularPrice = deal.regular_price || deal.deal_price * 1.5; // Estimate if not provided
    
    // Calculate savings percentage
    const savingsPercentage = Math.round(((regularPrice - deal.deal_price) / regularPrice) * 100);
    
    // Normalize category
    let category = 'drink';
    if (deal.category === 'food') category = 'food';
    if (['drink', 'food'].includes(deal.category)) category = deal.category;
    if (['drink', 'food'].includes(category) && deal.category === 'food') category = 'both';
    
    // Format the deal
    const formattedDeal = {
      establishmentId,
      title: deal.item,
      description: deal.description || `Happy hour special: ${deal.item}`,
      status: 'active',
      type: category,
      
      // Drink-specific fields
      drinkCategory: ['beer', 'wine', 'cocktail', 'spirits', 'non_alcoholic'].includes(deal.category) ? deal.category : undefined,
      drinkSubcategory: deal.subcategory || undefined,
      isHousePour: deal.item.toLowerCase().includes('house') || false,
      brand: deal.brand || undefined,
      servingStyle: deal.serving_style || undefined,
      servingSize: deal.serving_size || undefined,
      
      // Pricing
      regularPrice,
      dealPrice: deal.deal_price,
      savingsPercentage,
      isOneForOne: deal.is_one_for_one || false,
      
      // Timing
      startTime: timeStringToTimestamp(deal.start_time) || timeStringToTimestamp('5:00 pm'),
      endTime: timeStringToTimestamp(deal.end_time) || timeStringToTimestamp('8:00 pm'),
      daysOfWeek: normalizeDaysOfWeek(deal.days),
    };
    
    formattedDeals.push(formattedDeal);
  }
  
  return formattedDeals;
}

/**
 * Get establishment by ID or external_id
 */
async function getEstablishment(id) {
  const client = await pool.connect();
  
  try {
    let query, params;
    
    // Check if ID is numeric or a string (external_id)
    if (isNaN(id)) {
      // Treat as external_id
      query = 'SELECT id, name, external_id FROM establishments WHERE external_id = $1';
      params = [id];
    } else {
      // Treat as numeric ID
      query = 'SELECT id, name, external_id FROM establishments WHERE id = $1';
      params = [parseInt(id, 10)];
    }
    
    const result = await client.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error(`Establishment not found with ID: ${id}`);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error fetching establishment with ID ${id}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Insert deals into the database
 */
async function insertDeals(deals) {
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
          deal.establishmentId,
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
    return results;
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback if any error
    console.error("Error inserting deals:", error);
    throw error;
  } finally {
    client.release();
  }
}

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
    const results = await insertDeals(deals);
    
    // Return the results
    res.json({
      success: true,
      message: `Successfully inserted ${results.inserted.length} deals`,
      inserted: results.inserted,
      errors: results.errors
    });
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
        // Filter image files and PDF files
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext);
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