/**
 * Menu Analysis Script
 * 
 * This script analyzes a menu image/PDF to extract happy hour deals
 * using Claude's vision capabilities through the Anthropic API.
 * 
 * Usage:
 *   node analyze-menu.js <path-to-image>
 */

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Get dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert image file to base64
 */
function imageToBase64(filepath) {
  const imageBuffer = fs.readFileSync(filepath);
  return imageBuffer.toString('base64');
}

/**
 * Analyze menu image to extract happy hour deals
 */
export async function analyzeMenu(imagePath) {
  try {
    console.log(`Analyzing menu image: ${imagePath}`);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }
    
    // Get file extension
    const ext = path.extname(imagePath).toLowerCase();
    
    // Check file type
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      throw new Error(`Unsupported file type: ${ext}. Please use JPG, PNG, or WebP images.`);
    }
    
    // Convert image to base64
    const base64Image = imageToBase64(imagePath);
    
    // Determine media type
    let mediaType = 'image/jpeg';
    if (ext === '.png') mediaType = 'image/png';
    if (ext === '.webp') mediaType = 'image/webp';
    
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
export function formatDealsForDatabase(dealsData, establishmentId) {
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
 * This script is designed to be used both as an importable module and as a standalone script
 * 
 * When imported, the exported functions can be used directly
 * When run from the command line, it will analyze the menu and display the results
 */

// Export a CLI handler function but don't run it automatically
export async function cliHandler() {
  try {
    // Check command line arguments
    const args = process.argv.slice(2);
    if (args.length < 1) {
      console.error("Usage: node analyze-menu.js <path-to-image> [establishment-id]");
      process.exit(1);
    }
    
    const imagePath = args[0];
    const establishmentId = args[1] ? parseInt(args[1], 10) : null;
    
    // Analyze the menu
    const dealsData = await analyzeMenu(imagePath);
    
    // Print restaurant name if found
    if (dealsData.restaurant_name) {
      console.log(`\nRestaurant identified as: ${dealsData.restaurant_name}`);
    }
    
    // Display extracted deals
    console.log(`\nExtracted ${dealsData.deals.length} happy hour deals:`);
    console.log(JSON.stringify(dealsData.deals, null, 2));
    
    // Format for database if establishment ID is provided
    if (establishmentId) {
      const formattedDeals = formatDealsForDatabase(dealsData, establishmentId);
      console.log(`\nFormatted ${formattedDeals.length} deals for database insertion:`);
      console.log(JSON.stringify(formattedDeals, null, 2));
      
      // Here you could add code to insert the deals into the database
      // For now, we just display them
    }
    
    console.log("\nAnalysis complete!");
  } catch (error) {
    console.error("Error in menu analysis:", error);
    process.exit(1);
  }
}

// This check will only run the CLI handler if this script is run directly (not imported)
if (process.argv[1] === import.meta.url.substring(7)) { // Remove 'file://' from URL
  cliHandler();
}