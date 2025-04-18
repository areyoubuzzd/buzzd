/**
 * Script to add more Singapore locations to the database
 * 
 * This script adds popular locations in Singapore, 
 * especially those with high concentrations of restaurants and bars.
 * 
 * Run with: npx tsx scripts/add-singapore-locations.ts
 */

import { db } from "../server/db";
import { singaporeLocations } from "../shared/schema";
import { eq } from "drizzle-orm";

const locationsToAdd = [
  // Popular Areas
  {
    name: "Orchard Area",
    alternateNames: "Orchard, Shopping District, Orchard Area",
    postalCode: "238823",
    postalDistrict: "23",
    area: "Central",
    latitude: 1.3036,
    longitude: 103.8318,
    locationType: "district",
    isPopular: true
  },
  // New Locations from the list
  {
    name: "Little India",
    alternateNames: "Little India, Tekka Market, Serangoon Road",
    postalCode: "218148",
    postalDistrict: "21",
    area: "Central",
    latitude: 1.3066,
    longitude: 103.8518,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Tyrwhitt Road",
    alternateNames: "Tyrwhitt, Jalan Besar Area",
    postalCode: "207568",
    postalDistrict: "20",
    area: "Central",
    latitude: 1.3108,
    longitude: 103.8585,
    locationType: "road",
    isPopular: false
  },
  {
    name: "Syed Alwi Road",
    alternateNames: "Syed Alwi, Jalan Besar Area",
    postalCode: "207644",
    postalDistrict: "20",
    area: "Central", 
    latitude: 1.3109,
    longitude: 103.8557,
    locationType: "road",
    isPopular: false
  },
  {
    name: "Jalan Besar",
    alternateNames: "Jalan Besar Stadium, Jalan Besar Area",
    postalCode: "208803",
    postalDistrict: "20",
    area: "Central",
    latitude: 1.3102,
    longitude: 103.8610,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Kallang",
    alternateNames: "Kallang Stadium, Kallang Wave Mall",
    postalCode: "397630",
    postalDistrict: "39",
    area: "East",
    latitude: 1.3027,
    longitude: 103.8756,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Prinsep Street",
    alternateNames: "Prinsep, NAFA, Dhoby Ghaut Area",
    postalCode: "188649",
    postalDistrict: "18",
    area: "Central",
    latitude: 1.2999,
    longitude: 103.8499,
    locationType: "road",
    isPopular: false
  },
  {
    name: "Seah Street",
    alternateNames: "Seah Street, Bras Basah, Bugis Junction Area",
    postalCode: "188379",
    postalDistrict: "18",
    area: "Central",
    latitude: 1.2965,
    longitude: 103.8554,
    locationType: "road",
    isPopular: false
  },
  {
    name: "Liang Seah Street",
    alternateNames: "Liang Seah, Bugis Junction Area",
    postalCode: "189022",
    postalDistrict: "18",
    area: "Central",
    latitude: 1.2976,
    longitude: 103.8589,
    locationType: "road",
    isPopular: false
  },
  {
    name: "Purvis Street",
    alternateNames: "Purvis, Bugis Area",
    postalCode: "188588",
    postalDistrict: "18",
    area: "Central",
    latitude: 1.2960,
    longitude: 103.8565,
    locationType: "road",
    isPopular: false
  },
  {
    name: "Marina Bay",
    alternateNames: "MBS, Marina Bay Sands, Gardens by the Bay",
    postalCode: "018956",
    postalDistrict: "01",
    area: "Central",
    latitude: 1.2832,
    longitude: 103.8607,
    locationType: "district",
    isPopular: true
  },
  {
    name: "MBFC",
    alternateNames: "Marina Bay Financial Centre, Downtown Core",
    postalCode: "018982",
    postalDistrict: "01",
    area: "Central",
    latitude: 1.2790,
    longitude: 103.8546,
    locationType: "building",
    isPopular: true
  },
  {
    name: "Ann Siang Hill",
    alternateNames: "Ann Siang, Club Street, Chinatown Area",
    postalCode: "069695",
    postalDistrict: "06",
    area: "Central",
    latitude: 1.2804,
    longitude: 103.8455,
    locationType: "road",
    isPopular: true
  },
  {
    name: "Arab Street",
    alternateNames: "Arab Street, Kampong Glam",
    postalCode: "199740",
    postalDistrict: "19",
    area: "Central",
    latitude: 1.3020,
    longitude: 103.8588,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Haji Lane",
    alternateNames: "Haji Lane, Kampong Glam",
    postalCode: "189244",
    postalDistrict: "18",
    area: "Central",
    latitude: 1.3007,
    longitude: 103.8593,
    locationType: "road",
    isPopular: true
  },
  {
    name: "Kampong Glam",
    alternateNames: "Kampong Glam, Arab Street, Haji Lane",
    postalCode: "199784",
    postalDistrict: "19",
    area: "Central",
    latitude: 1.3022,
    longitude: 103.8596,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Raffles Place",
    alternateNames: "Raffles Place, CBD, Downtown Core",
    postalCode: "048616",
    postalDistrict: "04",
    area: "Central",
    latitude: 1.2840,
    longitude: 103.8509,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Anson Road",
    alternateNames: "Anson, Tanjong Pagar Area",
    postalCode: "079903",
    postalDistrict: "07",
    area: "Central",
    latitude: 1.2767,
    longitude: 103.8434,
    locationType: "road",
    isPopular: false
  },
  {
    name: "Robinson Road",
    alternateNames: "Robinson, CBD Area",
    postalCode: "048547",
    postalDistrict: "04",
    area: "Central",
    latitude: 1.2809,
    longitude: 103.8497,
    locationType: "road",
    isPopular: false
  },
  {
    name: "Amoy Street",
    alternateNames: "Amoy, Telok Ayer, CBD Area",
    postalCode: "069929",
    postalDistrict: "06",
    area: "Central",
    latitude: 1.2798,
    longitude: 103.8470,
    locationType: "road",
    isPopular: true
  },
  {
    name: "Club Street",
    alternateNames: "Club Street, Ann Siang, Chinatown Area",
    postalCode: "069464",
    postalDistrict: "06",
    area: "Central",
    latitude: 1.2810,
    longitude: 103.8454,
    locationType: "road",
    isPopular: true
  },
  {
    name: "Keong Saik",
    alternateNames: "Keong Saik Road, Chinatown Area",
    postalCode: "089135",
    postalDistrict: "08",
    area: "Central",
    latitude: 1.2798,
    longitude: 103.8422,
    locationType: "road",
    isPopular: true
  },
  {
    name: "Boat Quay",
    alternateNames: "Boat Quay, Singapore River",
    postalCode: "049839",
    postalDistrict: "04",
    area: "Central",
    latitude: 1.2877,
    longitude: 103.8505,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Clarke Quay",
    alternateNames: "Clarke Quay, Singapore River",
    postalCode: "179023",
    postalDistrict: "17",
    area: "Central",
    latitude: 1.2906,
    longitude: 103.8465,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Robertson Quay",
    alternateNames: "Robertson Quay, Singapore River",
    postalCode: "238236",
    postalDistrict: "23",
    area: "Central",
    latitude: 1.2907,
    longitude: 103.8390,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Tiong Bahru",
    alternateNames: "Tiong Bahru, Hipster Area",
    postalCode: "168731",
    postalDistrict: "16",
    area: "Central",
    latitude: 1.2836,
    longitude: 103.8294,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Holland Village",
    alternateNames: "Holland V, Holland Village",
    postalCode: "278967",
    postalDistrict: "27",
    area: "West",
    latitude: 1.3117,
    longitude: 103.7961,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Telok Ayer",
    alternateNames: "Telok Ayer, Chinatown Area",
    postalCode: "068813",
    postalDistrict: "06",
    area: "Central",
    latitude: 1.2805,
    longitude: 103.8487,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Duxton",
    alternateNames: "Duxton Hill, Duxton Road, Tanjong Pagar Area",
    postalCode: "089590",
    postalDistrict: "08",
    area: "Central",
    latitude: 1.2785,
    longitude: 103.8426,
    locationType: "road",
    isPopular: true
  },
  {
    name: "Tanjong Pagar",
    alternateNames: "Tanjong Pagar, Korea Town",
    postalCode: "088445",
    postalDistrict: "08",
    area: "Central",
    latitude: 1.2766,
    longitude: 103.8451,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Dempsey",
    alternateNames: "Dempsey Hill, Tanglin Area",
    postalCode: "249677",
    postalDistrict: "24",
    area: "Central",
    latitude: 1.3065,
    longitude: 103.8098,
    locationType: "district",
    isPopular: true
  },
  {
    name: "One-North",
    alternateNames: "One-North, Buona Vista, Business Park",
    postalCode: "138671",
    postalDistrict: "13",
    area: "West",
    latitude: 1.2996,
    longitude: 103.7876,
    locationType: "district",
    isPopular: false
  },
  {
    name: "East Coast",
    alternateNames: "East Coast Park, Marine Parade",
    postalCode: "449876",
    postalDistrict: "44",
    area: "East",
    latitude: 1.3007,
    longitude: 103.9147,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Katong",
    alternateNames: "Katong, East Coast Area",
    postalCode: "428724",
    postalDistrict: "42",
    area: "East",
    latitude: 1.3082,
    longitude: 103.9018,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Joo Chiat",
    alternateNames: "Joo Chiat, East Coast Area",
    postalCode: "427486",
    postalDistrict: "42",
    area: "East",
    latitude: 1.3140,
    longitude: 103.9022,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Upper Thomson",
    alternateNames: "Upper Thomson, Thomson Area",
    postalCode: "574408",
    postalDistrict: "57",
    area: "North",
    latitude: 1.3559,
    longitude: 103.8275,
    locationType: "district",
    isPopular: false
  },
  {
    name: "Novena",
    alternateNames: "Novena, Square 2, Medical Hub",
    postalCode: "307683",
    postalDistrict: "30",
    area: "Central",
    latitude: 1.3204,
    longitude: 103.8428,
    locationType: "district",
    isPopular: false
  },
  {
    name: "Bugis",
    alternateNames: "Bugis, Bugis Junction, Bugis+",
    postalCode: "188021",
    postalDistrict: "18",
    area: "Central",
    latitude: 1.2990,
    longitude: 103.8550,
    locationType: "district",
    isPopular: true
  },
  {
    name: "City Hall",
    alternateNames: "City Hall, Raffles City, Padang",
    postalCode: "179103",
    postalDistrict: "17",
    area: "Central",
    latitude: 1.2932,
    longitude: 103.8529,
    locationType: "district",
    isPopular: true
  },
  {
    name: "Sentosa",
    alternateNames: "Sentosa, Resorts World Sentosa",
    postalCode: "099419",
    postalDistrict: "09",
    area: "South",
    latitude: 1.2494,
    longitude: 103.8303,
    locationType: "district",
    isPopular: true
  }
];

async function addLocations() {
  console.log(`Adding ${locationsToAdd.length} locations to the database...`);
  
  try {
    // Check if these locations already exist to avoid duplicates
    for (const location of locationsToAdd) {
      // Check if location already exists with the same name
      const existingLocations = await db.select()
        .from(singaporeLocations)
        .where(eq(singaporeLocations.name, location.name));
      
      if (existingLocations.length > 0) {
        console.log(`Location "${location.name}" already exists, skipping...`);
        continue;
      }
      
      // Insert the location
      await db.insert(singaporeLocations).values({
        ...location,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`Added location: ${location.name}`);
    }
    
    console.log('Finished adding locations!');
  } catch (error) {
    console.error('Error adding locations:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
addLocations();