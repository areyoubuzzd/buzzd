import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for images
const baseDir = path.join(process.cwd(), 'public/images/drinks');

// Define all the drink categories we need folders for
const categories = [
  // Main categories
  'beer', 
  'wine', 
  'cocktail', 
  'spirit',
  
  // Beer subcategories
  'beer_pint', 
  'beer_bucket', 
  'beer_tower', 
  'beer_bottle', 
  'beer_craft',
  
  // Wine subcategories
  'wine_red', 
  'wine_white', 
  'wine_rose', 
  'wine_sparkling', 
  'wine_bottle',
  
  // Cocktail subcategories
  'cocktail_margarita', 
  'cocktail_mojito', 
  'cocktail_martini', 
  'cocktail_negroni', 
  'cocktail_old_fashioned', 
  'cocktail_long_island',
  
  // Spirit subcategories
  'spirit_whisky', 
  'spirit_vodka', 
  'spirit_rum', 
  'spirit_gin', 
  'spirit_tequila',
  
  // Misc categories
  'general',
  'food',
  'dessert'
];

// Create the directories
categories.forEach(category => {
  const dirPath = path.join(baseDir, category);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  } else {
    console.log(`Directory already exists: ${dirPath}`);
  }
});

console.log('Done! All drink category folders have been created.');