/**
 * Cloudinary Image Upload Tool for Happy Hour App
 * 
 * This tool makes it easy to upload images to Cloudinary in the correct folder structure.
 * 
 * Usage:
 *   node uploadTool.js [command] [params...]
 * 
 * Commands:
 *   background [file] [category]                 - Upload background image for a category
 *   brand [file] [category] [brand] [style]      - Upload brand image (bottle/glass)
 *   cocktail [file] [cocktailName]               - Upload cocktail image
 *   restaurant [file] [restaurantId]             - Upload restaurant logo
 *   default [file] [type] [category?]            - Upload default image
 *   help                                         - Show this help message
 *   test                                         - Test Cloudinary connection
 *   structure                                    - Show folder structure
 * 
 * Examples:
 *   node uploadTool.js background ./images/beer-bg.png beer
 *   node uploadTool.js brand ./images/heineken-bottle.png beer heineken bottle
 *   node uploadTool.js cocktail ./images/margarita.png margarita
 *   node uploadTool.js restaurant ./images/logo.png restaurant123
 *   node uploadTool.js default ./images/default-beer.png bottle beer
 */
const cloudinaryUploader = require('./utils/cloudinaryUploader');

// Display help message
function showHelp() {
  console.log(`
Cloudinary Image Upload Tool for Happy Hour App

This tool makes it easy to upload images to Cloudinary in the correct folder structure.

Usage:
  node uploadTool.js [command] [params...]

Commands:
  background [file] [category]                 - Upload background image for a category
  brand [file] [category] [brand] [style]      - Upload brand image (bottle/glass)
  cocktail [file] [cocktailName]               - Upload cocktail image
  restaurant [file] [restaurantId]             - Upload restaurant logo
  default [file] [type] [category?]            - Upload default image
  help                                         - Show this help message
  test                                         - Test Cloudinary connection
  structure                                    - Show folder structure

Examples:
  node uploadTool.js background ./images/beer-bg.png beer
  node uploadTool.js brand ./images/heineken-bottle.png beer heineken bottle
  node uploadTool.js cocktail ./images/margarita.png margarita
  node uploadTool.js restaurant ./images/logo.png restaurant123
  node uploadTool.js default ./images/default-beer.png bottle beer
  `);
}

// Show folder structure
function showStructure() {
  const structure = cloudinaryUploader.getFolderStructure();
  
  console.log('\nCloudinary Folder Structure for Happy Hour App\n');
  
  Object.entries(structure).forEach(([key, info]) => {
    console.log(`\x1b[1m${key.toUpperCase()}\x1b[0m`);
    console.log(`Description: ${info.description}`);
    console.log(`Path Format: ${info.path}`);
    console.log('Examples:');
    info.examples.forEach(example => {
      console.log(`  - ${example}`);
    });
    console.log('');
  });
}

// Process command line arguments
async function processArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('No command specified. Use "help" to see available commands.');
    return;
  }
  
  const command = args[0].toLowerCase();
  
  try {
    switch (command) {
      case 'help':
        showHelp();
        break;
        
      case 'structure':
        showStructure();
        break;
        
      case 'test':
        console.log('Testing Cloudinary connection...');
        const isConnected = await cloudinaryUploader.testConnection();
        if (isConnected) {
          console.log('✅ Cloudinary connection successful!');
        } else {
          console.log('❌ Cloudinary connection failed. Check your credentials in .env file.');
        }
        break;
        
      case 'background':
        if (args.length < 3) {
          console.log('Missing parameters. Usage: background [file] [category]');
          return;
        }
        await cloudinaryUploader.uploadBackgroundImage(args[1], args[2]);
        break;
        
      case 'brand':
        if (args.length < 5) {
          console.log('Missing parameters. Usage: brand [file] [category] [brand] [style]');
          return;
        }
        await cloudinaryUploader.uploadBrandImage(args[1], args[2], args[3], args[4]);
        break;
        
      case 'cocktail':
        if (args.length < 3) {
          console.log('Missing parameters. Usage: cocktail [file] [cocktailName]');
          return;
        }
        await cloudinaryUploader.uploadCocktailImage(args[1], args[2]);
        break;
        
      case 'restaurant':
        if (args.length < 3) {
          console.log('Missing parameters. Usage: restaurant [file] [restaurantId]');
          return;
        }
        await cloudinaryUploader.uploadRestaurantLogo(args[1], args[2]);
        break;
        
      case 'default':
        if (args.length < 3) {
          console.log('Missing parameters. Usage: default [file] [type] [category?]');
          return;
        }
        
        const category = args.length > 3 ? args[3] : null;
        await cloudinaryUploader.uploadDefaultImage(args[1], args[2], category);
        break;
        
      default:
        console.log(`Unknown command: "${command}". Use "help" to see available commands.`);
        break;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Run the tool
processArgs();