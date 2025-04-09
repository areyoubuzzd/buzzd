/**
 * Script to import a curated list of restaurants with happy hour deals
 * 
 * This script takes restaurant names from a list and looks up their details
 * using the Google Places API before importing them into the database.
 * 
 * Usage:
 * - Create a file called 'happy-hour-restaurants.txt', one restaurant name per line
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
const restaurantListPath = path.join(process.cwd(), 'happy-hour-restaurants.txt');

/**
 * Read restaurant names from the input file
 */
async function readRestaurantNames() {
  if (!fs.existsSync(restaurantListPath)) {
    console.error(`Error: File ${restaurantListPath} not found.`);
    console.error('Please create a file called "happy-hour-restaurants.txt" with one restaurant name per line.');
    process.exit(1);
  }

  const fileStream = fs.createReadStream(restaurantListPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const restaurantNames = [];
  for await (const line of rl) {
    // Skip empty lines and lines starting with #
    if (line.trim() && !line.trim().startsWith('#')) {
      restaurantNames.push(line.trim());
    }
  }

  return restaurantNames;
}

/**
 * Search for a restaurant using Google Places API
 */
async function searchRestaurant(name) {
  try {
    console.log(`Searching for restaurant: ${name}`);

    // Add "Singapore" to search query if not already included
    let searchQuery = name;
    if (!name.toLowerCase().includes('singapore')) {
      searchQuery = `${name}, Singapore`;
    }

    // Search for the restaurant
    const placesResponse = await googleMapsClient.textSearch({
      params: {
        query: searchQuery,
        type: "restaurant",
        key: apiKey,
      }
    });

    if (placesResponse.data.results.length === 0) {
      console.warn(`Warning: No results found for "${name}"`);
      return null;
    }

    // Get the first result (most relevant)
    const place = placesResponse.data.results[0];
    
    // Extract postal code if available
    let postalCode = "238839"; // Default to Orchard Road postal code
    if (place.formatted_address) {
      const postalCodeMatch = place.formatted_address.match(/Singapore\s+(\d{6})/);
      if (postalCodeMatch) {
        postalCode = postalCodeMatch[1];
      }
    }

    return {
      name: place.name,
      address: place.formatted_address || `${place.name}, Singapore`,
      city: "Singapore",
      postal_code: postalCode,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating || 4.0,
      type: place.types ? place.types.find(t => 
        ["restaurant", "bar", "cafe", "food"].includes(t)
      ) || "restaurant" : "restaurant",
      description: `Restaurant in ${place.vicinity || 'Singapore'}`,
      image_url: place.photos && place.photos.length > 0 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
        : null
    };
  } catch (error) {
    console.error(`Error searching for "${name}":`, error.response?.data?.error_message || error.message);
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
             latitude = $5, longitude = $6, image_url = $7, rating = $8, type = $9
         WHERE id = $10`,
        [
          restaurant.description,
          restaurant.address,
          restaurant.city,
          restaurant.postal_code,
          restaurant.latitude,
          restaurant.longitude,
          restaurant.image_url,
          restaurant.rating,
          restaurant.type,
          id
        ]
      );
    } else {
      // Insert new restaurant
      console.log(`Inserting new restaurant: ${restaurant.name}`);
      
      const result = await client.query(
        `INSERT INTO establishments 
         (name, description, address, city, postal_code, latitude, longitude, image_url, rating, type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
          restaurant.type
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
 * Main function
 */
async function main() {
  try {
    // Read restaurant names from file
    const restaurantNames = await readRestaurantNames();
    console.log(`Found ${restaurantNames.length} restaurant names in input file`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process each restaurant
    for (const name of restaurantNames) {
      // Search for restaurant details
      const restaurant = await searchRestaurant(name);
      
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
    console.log(`- Total restaurants processed: ${restaurantNames.length}`);
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