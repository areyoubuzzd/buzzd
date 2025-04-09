/**
 * Script to fetch restaurant data from Google Places API
 * for a specific street or area in Singapore
 * 
 * Required environment variable:
 * - GOOGLE_MAPS_API_KEY: Your Google Maps API key with Places API enabled
 */

import { Client } from "@googlemaps/google-maps-services-js";
import pg from 'pg';

// Required API key
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) {
  console.error("Error: GOOGLE_MAPS_API_KEY environment variable is required");
  process.exit(1);
}

// Database connection
const dbConnectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString: dbConnectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize Google Maps client
const googleMapsClient = new Client({});

/**
 * Fetch restaurants for a specific location
 * @param {string} location - Location name, e.g., "Orchard Road, Singapore"
 */
async function fetchRestaurants(location) {
  try {
    console.log(`Searching for restaurants in: ${location}`);
    
    // Add ", Singapore" if not already included
    if (!location.toLowerCase().includes('singapore')) {
      location = `${location}, Singapore`;
    }
    
    // First, get location coordinates with geocoding
    const geocodeResponse = await googleMapsClient.geocode({
      params: {
        address: location,
        key: apiKey,
      }
    });
    
    if (geocodeResponse.data.results.length === 0) {
      console.error("Could not find the specified location");
      return [];
    }
    
    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
    console.log(`Location found at coordinates: ${lat}, ${lng}`);
    
    // Now search for restaurants near that location
    const placesResponse = await googleMapsClient.placesNearby({
      params: {
        location: { lat, lng },
        radius: 1000, // 1km radius
        type: "restaurant",
        key: apiKey,
      }
    });
    
    const restaurants = placesResponse.data.results;
    console.log(`Found ${restaurants.length} restaurants`);
    
    // Process and format restaurant data
    const formattedRestaurants = restaurants.map(place => {
      // Extract postal code from address if available
      let postalCode = null;
      if (place.vicinity) {
        const postalCodeMatch = place.vicinity.match(/Singapore\s+(\d{6})/);
        if (postalCodeMatch) {
          postalCode = postalCodeMatch[1];
        }
      }
      
      return {
        name: place.name,
        address: place.vicinity || `${place.name}, Singapore`,
        city: "Singapore",
        postal_code: postalCode || "238839", // Default to Orchard Road postal code
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating || 4.0,
        type: place.types ? place.types.find(t => 
          ["restaurant", "bar", "cafe", "food"].includes(t)
        ) || "restaurant" : "restaurant",
        description: `Located in ${location.split(',')[0]}`,
        image_url: place.photos && place.photos.length > 0 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
          : null
      };
    });
    
    return formattedRestaurants;
  } catch (error) {
    console.error("Error fetching restaurants:", error.response?.data?.error_message || error.message);
    throw error;
  }
}

/**
 * Save restaurants to database
 * @param {Array} restaurants - Formatted restaurant data
 */
async function saveRestaurantsToDatabase(restaurants) {
  const client = await pool.connect();
  let savedCount = 0;
  
  try {
    await client.query('BEGIN');
    
    for (const restaurant of restaurants) {
      // Check if restaurant already exists
      const checkResult = await client.query(
        'SELECT id FROM establishments WHERE name = $1',
        [restaurant.name]
      );
      
      if (checkResult.rows.length > 0) {
        // Update existing restaurant
        const id = checkResult.rows[0].id;
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
        
        await client.query(
          `INSERT INTO establishments 
           (name, description, address, city, postal_code, latitude, longitude, image_url, rating, type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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
      }
      
      savedCount++;
    }
    
    await client.query('COMMIT');
    return savedCount;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving restaurants to database:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main function to fetch and save restaurants
 */
async function main() {
  if (process.argv.length < 3) {
    console.error("Usage: node fetch-google-places.js \"<location>\"");
    console.error("Example: node fetch-google-places.js \"Orchard Road\"");
    process.exit(1);
  }
  
  const location = process.argv[2];
  
  try {
    // Fetch restaurants from Google Places API
    const restaurants = await fetchRestaurants(location);
    
    if (restaurants.length === 0) {
      console.log("No restaurants found for the specified location.");
      process.exit(0);
    }
    
    // Save to database
    const savedCount = await saveRestaurantsToDatabase(restaurants);
    console.log(`Successfully saved ${savedCount} restaurants to database.`);
    
    process.exit(0);
  } catch (error) {
    console.error("Operation failed:", error);
    process.exit(1);
  } finally {
    pool.end();
  }
}

// Run the script
main();