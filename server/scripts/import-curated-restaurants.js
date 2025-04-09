/**
 * Script to import a curated list of restaurants with happy hour deals
 * 
 * This script takes restaurant names and areas from a CSV file and looks up their details
 * using the Google Places API before importing them into the database.
 * 
 * Usage:
 * - Create a file called 'happy-hour-restaurants.csv' with this format:
 *   restaurant_name,area
 *   For example:
 *   "Harry's Bar,Holland Village"
 *   "Brewerkz,Clarke Quay"
 * - Run: node import-curated-restaurants.js
 */

import { Client } from "@googlemaps/google-maps-services-js";
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Required environment variables
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) {
  console.error("Error: GOOGLE_MAPS_API_KEY environment variable is required");
  process.exit(1);
}

const dbConnectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString: dbConnectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize Google Maps client
const googleMapsClient = new Client({});

// File path for the list of restaurants
const restaurantListPath = path.join(process.cwd(), 'happy-hour-restaurants.csv');

/**
 * Read restaurant data from the input CSV file
 * @returns {Array<{name: string, area: string}>} Array of restaurant data objects
 */
async function readRestaurantData() {
  if (!fs.existsSync(restaurantListPath)) {
    console.error(`Error: File ${restaurantListPath} not found.`);
    console.error('Please create a file called "happy-hour-restaurants.csv" with format: restaurant_name,area');
    process.exit(1);
  }

  const fileStream = fs.createReadStream(restaurantListPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const restaurants = [];
  let isFirstLine = true;
  
  for await (const line of rl) {
    // Skip empty lines, lines starting with #, and the header row
    if (line.trim() && !line.trim().startsWith('#')) {
      if (isFirstLine) {
        // Skip header row if it exists (check if it looks like a header)
        if (line.toLowerCase().includes('restaurant') && line.toLowerCase().includes('area')) {
          isFirstLine = false;
          continue;
        }
      }
      
      isFirstLine = false;
      
      // Parse CSV line (handle quoted values)
      let parts;
      if (line.includes('"')) {
        // Use regex to handle quoted values with commas inside
        const regex = /(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g;
        parts = [];
        let match;
        while ((match = regex.exec(line + ',')) !== null) {
          let value = match[1];
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1).replace(/""/g, '"');
          }
          parts.push(value);
        }
      } else {
        // Simple split for unquoted values
        parts = line.split(',');
      }
      
      if (parts.length >= 2) {
        restaurants.push({
          name: parts[0].trim(),
          area: parts[1].trim()
        });
      } else {
        console.warn(`Warning: Skipping invalid line: ${line}`);
      }
    }
  }

  return restaurants;
}

/**
 * Search for a restaurant using Google Places API
 */
async function searchRestaurant(restaurant) {
  try {
    const { name, area } = restaurant;
    console.log(`Searching for restaurant: ${name} in ${area}`);

    // Construct search query with name and area
    let searchQuery = `${name}, ${area}, Singapore`;

    // Search for the restaurant
    const placesResponse = await googleMapsClient.textSearch({
      params: {
        query: searchQuery,
        type: "restaurant",
        key: apiKey,
      }
    });

    let place;
    
    if (placesResponse.data.results.length === 0) {
      console.warn(`Warning: No results found for "${name}" in ${area}`);
      
      // Try again without area as fallback
      console.log(`Trying again with just restaurant name: ${name}`);
      const fallbackResponse = await googleMapsClient.textSearch({
        params: {
          query: `${name}, Singapore`,
          type: "restaurant",
          key: apiKey,
        }
      });
      
      if (fallbackResponse.data.results.length === 0) {
        console.warn(`Warning: No results found for "${name}" in Singapore`);
        return null;
      }
      
      // Get the first result from fallback search
      place = fallbackResponse.data.results[0];
    } else {
      // Get the first result (most relevant)
      place = placesResponse.data.results[0];
    }
    
    console.log(`Found ${place.name} at ${place.formatted_address}`);
    
    // Extract postal code if available
    let postalCode = "238839"; // Default to Orchard Road postal code
    if (place.formatted_address) {
      const postalCodeMatch = place.formatted_address.match(/Singapore\s+(\d{6})/);
      if (postalCodeMatch) {
        postalCode = postalCodeMatch[1];
      }
    }

    // Determine cuisine type based on place types
    let cuisine = "restaurant";
    if (place.types) {
      if (place.types.includes("bar")) cuisine = "bar";
      else if (place.types.includes("cafe")) cuisine = "cafe";
      else if (place.types.includes("restaurant")) cuisine = "restaurant";
      // Add more specific cuisine types if they exist in place.types
    }
    
    return {
      name: place.name,
      address: place.formatted_address || `${place.name}, Singapore`,
      city: "Singapore",
      postal_code: postalCode,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating || null, // Use Google Places rating
      cuisine: cuisine, // Changed from type to cuisine
      price: place.price_level || null, // Google's price level (1-4) or null if not available
      priority: null, // Set to null initially
      description: `Restaurant in ${place.vicinity || 'Singapore'}`,
      image_url: place.photos && place.photos.length > 0 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
        : null
    };
  } catch (error) {
    console.error(`Error searching for "${restaurant.name}" in ${restaurant.area}:`, error.response?.data?.error_message || error.message);
    return null;
  }
}

/**
 * Save a restaurant to the database
 */
async function saveRestaurantToDatabase(restaurant) {
  const client = await pool.connect();
  
  try {
    // Check if restaurant already exists
    const checkResult = await client.query(
      'SELECT id FROM establishments WHERE name = $1',
      [restaurant.name]
    );
    
    let id;
    if (checkResult.rows.length > 0) {
      // Update existing restaurant
      id = checkResult.rows[0].id;
      console.log(`Updating restaurant: ${restaurant.name} (ID: ${id})`);
      
      await client.query(
        `UPDATE establishments 
         SET description = $1, address = $2, city = $3, postal_code = $4, 
             latitude = $5, longitude = $6, image_url = $7, rating = $8, cuisine = $9,
             price = $10, priority = $11
         WHERE id = $12`,
        [
          restaurant.description,
          restaurant.address,
          restaurant.city,
          restaurant.postal_code,
          restaurant.latitude,
          restaurant.longitude,
          restaurant.image_url,
          restaurant.rating,
          restaurant.cuisine,
          restaurant.price,
          restaurant.priority,
          id
        ]
      );
    } else {
      // Insert new restaurant
      console.log(`Inserting new restaurant: ${restaurant.name}`);
      
      const result = await client.query(
        `INSERT INTO establishments 
         (name, description, address, city, postal_code, latitude, longitude, image_url, rating, cuisine, price, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          restaurant.name,
          restaurant.description,
          restaurant.address,
          restaurant.city,
          restaurant.postal_code,
          restaurant.latitude,
          restaurant.longitude,
          restaurant.image_url,
          restaurant.rating,
          restaurant.cuisine,
          restaurant.price,
          restaurant.priority
        ]
      );
      
      id = result.rows[0].id;
    }
    
    return id;
  } catch (error) {
    console.error(`Error saving restaurant "${restaurant.name}" to database:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create a sample CSV file
 */
function createSampleCsvFile() {
  const sampleContent = `restaurant_name,area
"Harry's Bar,Holland Village"
"Wala Wala Cafe Bar,Holland Village"
"Brewerkz,Clarke Quay"
"Muddy Murphy's Irish Pub,Orchard Road"
"The Penny Black,Boat Quay"
"Hard Rock Cafe,Orchard Road"`;

  fs.writeFileSync(restaurantListPath, sampleContent, 'utf8');
  console.log(`Created sample file at ${restaurantListPath}`);
  console.log('You can now edit this file to include your restaurants with happy hour deals');
}

/**
 * Main function
 */
async function main() {
  // Check command line arguments
  const args = process.argv.slice(2);
  if (args.includes('--create-sample')) {
    createSampleCsvFile();
    return;
  }

  try {
    // Check if the file exists
    if (!fs.existsSync(restaurantListPath)) {
      console.error(`Error: File ${restaurantListPath} not found.`);
      console.error('Run with --create-sample to create a sample file, or create it manually.');
      process.exit(1);
    }

    // Read restaurant data from file
    const restaurants = await readRestaurantData();
    console.log(`Found ${restaurants.length} restaurants in input file`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process each restaurant
    for (const restaurantData of restaurants) {
      // Search for restaurant details
      const restaurant = await searchRestaurant(restaurantData);
      
      if (restaurant) {
        // Save to database
        await saveRestaurantToDatabase(restaurant);
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add a small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\nImport summary:`);
    console.log(`- Total restaurants processed: ${restaurants.length}`);
    console.log(`- Successfully imported: ${successCount}`);
    console.log(`- Failed to import: ${failureCount}`);
    
    console.log(`\nCreated establishments can now be used to add happy hour deals!`);
  } catch (error) {
    console.error('Operation failed:', error);
  } finally {
    pool.end();
  }
}

// Run the script
main();