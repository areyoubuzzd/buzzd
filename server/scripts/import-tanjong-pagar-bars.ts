/**
 * Script to import bars and restaurants from Tanjong Pagar Road and Duxton Road
 * using Google Places API
 */

import 'dotenv/config';
import axios from 'axios';
import { db } from '../db';
import { establishments } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error('GOOGLE_MAPS_API_KEY environment variable is required');
}

// Coordinates for Tanjong Pagar and Duxton area
const TANJONG_PAGAR_LOCATION = {
  lat: 1.2769,
  lng: 103.8437
};

// Counter for generating external IDs
let externalIdCounter = 200; // Start from SG0200 to avoid conflicts

// Function to search for establishments using Google Places API
async function searchEstablishments(query: string, location: { lat: number, lng: number }, radius: number = 500) {
  try {
    // Make a request to the Google Places API Nearby Search endpoint
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        key: GOOGLE_MAPS_API_KEY,
        location: `${location.lat},${location.lng}`,
        radius: radius,
        type: 'bar',
        keyword: query
      }
    });

    if (response.data.status !== 'OK') {
      console.error('Error from Google Places API:', response.data.status);
      return [];
    }

    return response.data.results;
  } catch (error) {
    console.error('Error fetching from Google Places API:', error);
    throw error;
  }
}

// Function to get place details using Google Places API
async function getPlaceDetails(placeId: string) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        key: GOOGLE_MAPS_API_KEY,
        place_id: placeId,
        fields: 'name,formatted_address,geometry,rating,photos,price_level,types'
      }
    });

    if (response.data.status !== 'OK') {
      console.error('Error fetching place details:', response.data.status);
      return null;
    }

    return response.data.result;
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw error;
  }
}

// Function to transform Google Places data to our schema
function transformToEstablishmentData(place: any) {
  // Extract postal code from formatted address if available
  const postalCodeMatch = place.formatted_address?.match(/Singapore\s+(\d{6})/);
  const postalCode = postalCodeMatch ? postalCodeMatch[1] : '000000';

  // Determine the appropriate cuisine/type
  const types = place.types || [];
  let cuisine = 'bar';

  if (types.includes('restaurant')) {
    cuisine = 'restaurant';
  } else if (types.includes('cafe')) {
    cuisine = 'cafe';
  }

  // Generate photo URL if available
  let imageUrl = null;
  if (place.photos && place.photos.length > 0) {
    const photoReference = place.photos[0].photo_reference;
    imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
  }

  // Generate external ID
  const externalId = `SG0${externalIdCounter++}`;

  return {
    name: place.name,
    description: place.vicinity || place.formatted_address,
    address: place.formatted_address || place.vicinity,
    city: 'Singapore',
    postalCode: postalCode,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    rating: place.rating,
    imageUrl: imageUrl,
    cuisine: cuisine,
    price: place.price_level || null,
    external_id: externalId
  };
}

// Main function to import establishments
async function importEstablishmentsFromArea() {
  try {
    console.log('Starting import of Tanjong Pagar and Duxton Road establishments...');
    
    // Get the highest existing external_id to avoid duplicates
    const existingEstablishments = await db.select().from(establishments);
    for (const e of existingEstablishments) {
      if (e.external_id && e.external_id.startsWith('SG0')) {
        const idNumber = parseInt(e.external_id.substring(3));
        if (idNumber >= externalIdCounter) {
          externalIdCounter = idNumber + 1;
        }
      }
    }
    console.log(`Starting external ID counter at SG0${externalIdCounter}`);

    // Search for establishments in Tanjong Pagar Road
    console.log('Searching for bars on Tanjong Pagar Road...');
    const tanjongPagarResults = await searchEstablishments('bars on Tanjong Pagar Road', TANJONG_PAGAR_LOCATION);
    
    // Search for establishments in Duxton Road
    console.log('Searching for bars on Duxton Road...');
    const duxtonResults = await searchEstablishments('bars on Duxton Road', TANJONG_PAGAR_LOCATION);
    
    // Combine results and remove duplicates
    const allResults = [...tanjongPagarResults, ...duxtonResults];
    const uniqueResults = allResults.filter((v, i, a) => a.findIndex(t => t.place_id === v.place_id) === i);
    
    console.log(`Found ${uniqueResults.length} unique establishments`);
    
    let addedCount = 0;
    let updatedCount = 0;
    
    // Process each place
    for (const place of uniqueResults) {
      // Get more details for the place
      console.log(`Fetching details for ${place.name}...`);
      const placeDetails = await getPlaceDetails(place.place_id);
      
      if (!placeDetails) {
        console.log(`Skipping ${place.name} - could not fetch details`);
        continue;
      }
      
      // Transform the data
      const establishmentData = transformToEstablishmentData({...place, ...placeDetails});
      
      // Check if the establishment already exists by name
      const existingEstablishment = await db.select().from(establishments)
        .where(eq(establishments.name, establishmentData.name));
      
      if (existingEstablishment.length > 0) {
        // Update existing establishment
        console.log(`Updating ${establishmentData.name}...`);
        await db.update(establishments)
          .set(establishmentData)
          .where(eq(establishments.name, establishmentData.name));
        
        updatedCount++;
      } else {
        // Insert new establishment
        console.log(`Adding ${establishmentData.name}...`);
        await db.insert(establishments).values(establishmentData);
        
        addedCount++;
      }
      
      // Rate limiting - pause briefly between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Import complete: Added ${addedCount} new establishments, updated ${updatedCount} existing establishments`);
    
  } catch (error) {
    console.error('Error during import:', error);
  }
}

// Run the import function
importEstablishmentsFromArea().catch(console.error);