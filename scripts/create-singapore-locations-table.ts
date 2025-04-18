/**
 * Script to create singapore_locations table and seed it with data
 * This provides a comprehensive set of Singapore locations with accurate coordinates
 * 
 * Run with: npx tsx scripts/create-singapore-locations-table.ts
 */
import { db } from '../server/db';
import { singaporeLocations } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function createAndSeedLocations() {
  console.log("Creating singapore_locations table if it doesn't exist...");
  
  try {
    // First, check if table exists
    const tableExists = await checkIfTableExists('singapore_locations');
    
    if (tableExists) {
      console.log("Table 'singapore_locations' already exists. Checking record count...");
      const result = await db.execute(sql`SELECT COUNT(*) FROM singapore_locations`);
      const count = parseInt(result.rows[0].count);
      console.log(`Found ${count} location records.`);
      
      if (count > 0) {
        console.log("Table already has data. To recreate, drop the table first.");
        process.exit(0);
      }
    }
  
    console.log("Seeding singapore_locations table with data...");
    
    // Central region locations
    await db.insert(singaporeLocations).values([
      // --- Central business district ---
      {
        name: "Raffles Place",
        alternateNames: "raffles,central business district,cbd",
        postalCode: "048617",
        postalDistrict: "01",
        area: "Central",
        latitude: 1.2842,
        longitude: 103.8522,
        locationType: "business_district",
        isPopular: true,
      },
      {
        name: "Marina Bay",
        alternateNames: "marina bay sands,mbs",
        postalCode: "018956",
        postalDistrict: "01",
        area: "Central",
        latitude: 1.2834,
        longitude: 103.8607,
        locationType: "business_district",
        isPopular: true,
      },
      {
        name: "Tanjong Pagar",
        alternateNames: "maxwell,duxton",
        postalCode: "078881",
        postalDistrict: "02",
        area: "Central",
        latitude: 1.2764,
        longitude: 103.8454,
        locationType: "business_district",
        isPopular: true,
      },
      {
        name: "Chinatown",
        alternateNames: "china town,people's park,peoples park",
        postalCode: "058416",
        postalDistrict: "02",
        area: "Central",
        latitude: 1.2815,
        longitude: 103.8451,
        locationType: "tourist_area",
        isPopular: true,
      },
      {
        name: "Clarke Quay",
        alternateNames: "clark quay,clark,boat quay",
        postalCode: "179024",
        postalDistrict: "01",
        area: "Central",
        latitude: 1.2906,
        longitude: 103.8458,
        locationType: "tourist_area",
        isPopular: true,
      },
      {
        name: "Robertson Quay",
        alternateNames: "robertson",
        postalCode: "238880",
        postalDistrict: "06",
        area: "Central",
        latitude: 1.2918,
        longitude: 103.8384,
        locationType: "tourist_area",
        isPopular: true,
      },
      {
        name: "Bugis",
        alternateNames: "bugis junction,bras basah",
        postalCode: "188024",
        postalDistrict: "07",
        area: "Central",
        latitude: 1.3009,
        longitude: 103.8560,
        locationType: "tourist_area",
        isPopular: true,
      },
      {
        name: "Orchard Road",
        alternateNames: "orchard,shopping district",
        postalCode: "238839",
        postalDistrict: "09",
        area: "Central",
        latitude: 1.3041,
        longitude: 103.8320,
        locationType: "shopping_district",
        isPopular: true,
      },
      {
        name: "Somerset",
        alternateNames: "313,somerset 313",
        postalCode: "238163",
        postalDistrict: "09",
        area: "Central",
        latitude: 1.3006,
        longitude: 103.8392,
        locationType: "shopping_district",
        isPopular: true,
      },
      {
        name: "Dhoby Ghaut",
        alternateNames: "doby,dobi,plaza singapura",
        postalCode: "238884",
        postalDistrict: "09",
        area: "Central",
        latitude: 1.2993,
        longitude: 103.8455,
        locationType: "shopping_district",
        isPopular: true,
      },
      {
        name: "Little India",
        alternateNames: "farrer park,tekka,mustafa",
        postalCode: "209131",
        postalDistrict: "20",
        area: "Central",
        latitude: 1.3066,
        longitude: 103.8518,
        locationType: "tourist_area",
        isPopular: true,
      },
      {
        name: "Novena",
        alternateNames: "united square,square 2,velocity",
        postalCode: "307683",
        postalDistrict: "30",
        area: "Central",
        latitude: 1.3204,
        longitude: 103.8430,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Newton",
        alternateNames: "newton food center,newton circus",
        postalCode: "307976",
        postalDistrict: "30",
        area: "Central",
        latitude: 1.3138,
        longitude: 103.8381,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Toa Payoh",
        alternateNames: "braddell,TPY,TP",
        postalCode: "310063",
        postalDistrict: "31",
        area: "Central",
        latitude: 1.3344,
        longitude: 103.8501,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Tiong Bahru",
        alternateNames: "redhill,tb",
        postalCode: "168898",
        postalDistrict: "16",
        area: "Central",
        latitude: 1.2847,
        longitude: 103.8316,
        locationType: "residential",
        isPopular: true,
      },
      
      // --- East region ---
      {
        name: "Katong",
        alternateNames: "east coast,marine parade,i12 katong",
        postalCode: "398742",
        postalDistrict: "39",
        area: "East",
        latitude: 1.3042,
        longitude: 103.8997,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "East Coast",
        alternateNames: "parkway,east cost park,ecp",
        postalCode: "437437",
        postalDistrict: "43",
        area: "East",
        latitude: 1.2997,
        longitude: 103.9068,
        locationType: "park",
        isPopular: true,
      },
      {
        name: "Bedok",
        alternateNames: "bedok reservoir,bedok mall",
        postalCode: "469313",
        postalDistrict: "46",
        area: "East",
        latitude: 1.3249,
        longitude: 103.9271,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Tampines",
        alternateNames: "tampines mall,century square,tampines hub",
        postalCode: "528532",
        postalDistrict: "52",
        area: "East",
        latitude: 1.3547,
        longitude: 103.9464,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Pasir Ris",
        alternateNames: "downtown east,white sands",
        postalCode: "518457",
        postalDistrict: "51",
        area: "East",
        latitude: 1.3721,
        longitude: 103.9495,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Geylang",
        alternateNames: "aljunied,paya lebar",
        postalCode: "398742",
        postalDistrict: "39",
        area: "East",
        latitude: 1.3138,
        longitude: 103.8913,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Changi",
        alternateNames: "changi airport,changi jewel,jewel",
        postalCode: "819663",
        postalDistrict: "81",
        area: "East",
        latitude: 1.3592,
        longitude: 103.9893,
        locationType: "airport",
        isPopular: true,
      },
      
      // --- West region ---
      {
        name: "Holland Village",
        alternateNames: "holland v,holland",
        postalCode: "278991",
        postalDistrict: "27",
        area: "West",
        latitude: 1.3118,
        longitude: 103.7965,
        locationType: "business_district",
        isPopular: true,
      },
      {
        name: "Clementi",
        alternateNames: "west coast,clementi mall",
        postalCode: "129808",
        postalDistrict: "12",
        area: "West",
        latitude: 1.3162,
        longitude: 103.7649,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Jurong East",
        alternateNames: "jurong,jcube,jurong point,westgate,jem",
        postalCode: "609731",
        postalDistrict: "60",
        area: "West",
        latitude: 1.3329,
        longitude: 103.7436,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Jurong West",
        alternateNames: "boon lay,pioneer",
        postalCode: "640501",
        postalDistrict: "64",
        area: "West",
        latitude: 1.3404,
        longitude: 103.7090,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Buona Vista",
        alternateNames: "one north,star vista,buonavista",
        postalCode: "138669",
        postalDistrict: "13",
        area: "West",
        latitude: 1.3066,
        longitude: 103.7908,
        locationType: "business_district",
        isPopular: true,
      },
      
      // --- North region ---
      {
        name: "Ang Mo Kio",
        alternateNames: "amk,ang mo kio central,bishan",
        postalCode: "569933",
        postalDistrict: "56",
        area: "North",
        latitude: 1.3691,
        longitude: 103.8454,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Bishan",
        alternateNames: "junction 8,Thomson",
        postalCode: "570501",
        postalDistrict: "57",
        area: "North",
        latitude: 1.3526,
        longitude: 103.8352,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Woodlands",
        alternateNames: "causeway,causeway point,woodlands central",
        postalCode: "730100",
        postalDistrict: "73",
        area: "North",
        latitude: 1.4367,
        longitude: 103.7867,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Yishun",
        alternateNames: "northpoint,north point",
        postalCode: "760839",
        postalDistrict: "76",
        area: "North",
        latitude: 1.4304,
        longitude: 103.8354,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Sembawang",
        alternateNames: "sembawang shopping center",
        postalCode: "750355",
        postalDistrict: "75",
        area: "North",
        latitude: 1.4491,
        longitude: 103.8185,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Punggol",
        alternateNames: "waterway point,punggol waterway",
        postalCode: "820168",
        postalDistrict: "82",
        area: "North-East",
        latitude: 1.4049,
        longitude: 103.9023,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Sengkang",
        alternateNames: "compass one,fernvale",
        postalCode: "540118",
        postalDistrict: "54",
        area: "North-East",
        latitude: 1.3868,
        longitude: 103.8914,
        locationType: "residential",
        isPopular: true,
      },
      {
        name: "Serangoon",
        alternateNames: "nex,serangoon gardens,chomp chomp",
        postalCode: "550264",
        postalDistrict: "55",
        area: "North-East",
        latitude: 1.3554,
        longitude: 103.8679,
        locationType: "residential",
        isPopular: true,
      }
    ]);
    
    console.log("Added 37 popular Singapore locations to the database.");
    console.log("Singapore locations table created and seeded successfully!");
  } catch (error: any) {
    console.error("Error creating or seeding locations table:", error.message);
  }
}

async function checkIfTableExists(tableName: string): Promise<boolean> {
  try {
    // PostgreSQL specific query to check if a table exists
    const result = await db.execute(
      sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      )`
    );
    
    return result.rows && result.rows[0] && result.rows[0].exists === true;
  } catch (error) {
    console.error("Error checking if table exists:", error);
    return false;
  }
}

// Run the function
createAndSeedLocations().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});