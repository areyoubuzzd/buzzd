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
  console.log('Creating singapore_locations table if it does not exist...');
  
  // Check if table exists first to avoid errors
  const tableExists = await checkIfTableExists('singapore_locations');
  
  if (!tableExists) {
    try {
      // Create table schema using the schema definition
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS singapore_locations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          postalCode TEXT,
          postalDistrict TEXT,
          area TEXT,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          alternateNames TEXT,
          locationType TEXT,
          isPopular BOOLEAN DEFAULT false,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      console.log('Table created successfully!');
      
      // Seed with initial data
      await seedInitialLocations();
      
      console.log('Data seeded successfully!');
    } catch (error) {
      console.error('Error creating table:', error);
    }
  } else {
    console.log('Table already exists, skipping creation.');
    
    // Count rows to see if we need to seed data
    const count = await getRowCount();
    
    if (count === 0) {
      console.log('Table is empty, seeding initial data...');
      await seedInitialLocations();
      console.log('Data seeded successfully!');
    } else {
      console.log(`Table already has ${count} rows, skipping seed.`);
    }
  }
}

async function checkIfTableExists(tableName: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
    )
  `);
  
  return result.rows[0] && result.rows[0].exists === true;
}

async function getRowCount(): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(*) FROM singapore_locations
  `);
  
  return parseInt(result.rows[0]?.count || '0', 10);
}

async function seedInitialLocations() {
  console.log('Seeding initial Singapore locations...');
  
  // Popular locations in Singapore with accurate coordinates
  // Focus on areas with high concentration of bars and restaurants
  const initialLocations = [
    // Original popular locations
    {
      name: 'Orchard Road',
      postalCode: '238823',
      postalDistrict: '23',
      area: 'Central',
      latitude: 1.3036,
      longitude: 103.8318,
      alternateNames: 'Orchard, Shopping District, Orchard Area',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Somerset',
      postalCode: '238164',
      postalDistrict: '23',
      area: 'Orchard Area',
      latitude: 1.3006,
      longitude: 103.8368,
      alternateNames: 'Somerset MRT, 313 Somerset, Orchard Road',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Dhoby Ghaut',
      postalCode: '238826',
      postalDistrict: '23',
      area: 'Orchard Area',
      latitude: 1.2993,
      longitude: 103.8455,
      alternateNames: 'Plaza Singapura, The Cathay, Orchard Area',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Marina Bay Sands',
      postalCode: '018956',
      postalDistrict: '01',
      area: 'Central',
      latitude: 1.2835,
      longitude: 103.8607,
      alternateNames: 'MBS, Marina Bay',
      locationType: 'landmark',
      isPopular: true
    },
    {
      name: 'Chinatown',
      postalCode: '058416',
      postalDistrict: '05',
      area: 'Central',
      latitude: 1.2833,
      longitude: 103.8433,
      alternateNames: 'China Town, 牛车水',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Bugis',
      postalCode: '188021',
      postalDistrict: '18',
      area: 'Central',
      latitude: 1.3009,
      longitude: 103.8558,
      alternateNames: 'Bugis Junction, Bugis Street',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Raffles Place',
      postalCode: '048618',
      postalDistrict: '04',
      area: 'CBD',
      latitude: 1.2842,
      longitude: 103.8522,
      alternateNames: 'Central Business District, CBD',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Clarke Quay',
      postalCode: '179024',
      postalDistrict: '17',
      area: 'River Valley',
      latitude: 1.2909,
      longitude: 103.8463,
      alternateNames: 'Riverside, Singapore River',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Jurong East',
      postalCode: '609731',
      postalDistrict: '60',
      area: 'West',
      latitude: 1.3329,
      longitude: 103.7436,
      alternateNames: 'JCube, Westgate, Jurong',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Tampines',
      postalCode: '528783',
      postalDistrict: '52',
      area: 'East',
      latitude: 1.3522,
      longitude: 103.9454,
      alternateNames: 'Tampines Mall, Tampines Central',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Holland Village',
      postalCode: '278997',
      postalDistrict: '27',
      area: 'Central West',
      latitude: 1.3112,
      longitude: 103.7961,
      alternateNames: 'Holland V',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Tiong Bahru',
      postalCode: '168731',
      postalDistrict: '16',
      area: 'Central',
      latitude: 1.2847,
      longitude: 103.8273,
      alternateNames: 'Tiong Bahru Plaza',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Little India',
      postalCode: '208538',
      postalDistrict: '20',
      area: 'Central',
      latitude: 1.3067,
      longitude: 103.8517,
      alternateNames: 'Tekka, Serangoon Road, Little India Area',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Tyrwhitt Road',
      postalCode: '207564',
      postalDistrict: '20',
      area: 'Little India Area',
      latitude: 1.3093,
      longitude: 103.8561,
      alternateNames: 'Tyrwhitt, Jalan Besar, Little India',
      locationType: 'street',
      isPopular: true
    },
    {
      name: 'Syed Alwi Road',
      postalCode: '207630',
      postalDistrict: '20',
      area: 'Little India Area',
      latitude: 1.3103,
      longitude: 103.8549,
      alternateNames: 'Syed Alwi, Mustafa Centre, Little India',
      locationType: 'street',
      isPopular: true
    },
    {
      name: 'Sentosa Island',
      postalCode: '099981',
      postalDistrict: '09',
      area: 'South',
      latitude: 1.2494,
      longitude: 103.8303,
      alternateNames: 'Sentosa, Resort World Sentosa',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Tanjong Pagar',
      postalCode: '078868',
      postalDistrict: '07',
      area: 'CBD',
      latitude: 1.2766,
      longitude: 103.8457,
      alternateNames: 'Duxton, Tras Street',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Dempsey Hill',
      postalCode: '249670',
      postalDistrict: '24',
      area: 'Central',
      latitude: 1.3053,
      longitude: 103.8093,
      alternateNames: 'Dempsey, Tanglin',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'East Coast Park',
      postalCode: '449876',
      postalDistrict: '44',
      area: 'East',
      latitude: 1.3017,
      longitude: 103.9181,
      alternateNames: 'ECP, East Coast',
      locationType: 'park',
      isPopular: true
    },
    
    // Additional locations with high concentration of bars/restaurants
    {
      name: 'Robertson Quay',
      postalCode: '238879',
      postalDistrict: '23',
      area: 'River Valley',
      latitude: 1.2908,
      longitude: 103.8367,
      alternateNames: 'Robertson, Riverside',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Boat Quay',
      postalCode: '049860',
      postalDistrict: '04',
      area: 'CBD',
      latitude: 1.2872,
      longitude: 103.8503,
      alternateNames: 'Singapore River, Riverside',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Amoy Street',
      postalCode: '069924',
      postalDistrict: '06',
      area: 'CBD',
      latitude: 1.2798,
      longitude: 103.8470,
      alternateNames: 'Telok Ayer, Far East Square',
      locationType: 'street',
      isPopular: true
    },
    {
      name: 'Ann Siang Hill',
      postalCode: '069788',
      postalDistrict: '06',
      area: 'Chinatown',
      latitude: 1.2803,
      longitude: 103.8453,
      alternateNames: 'Club Street, Ann Siang Road',
      locationType: 'street',
      isPopular: true
    },
    {
      name: 'Keong Saik Road',
      postalCode: '089144',
      postalDistrict: '08',
      area: 'Chinatown',
      latitude: 1.2792,
      longitude: 103.8410,
      alternateNames: 'Keong Saik, Chinatown',
      locationType: 'street',
      isPopular: true
    },
    {
      name: 'Haji Lane',
      postalCode: '189244',
      postalDistrict: '18',
      area: 'Kampong Glam',
      latitude: 1.3020,
      longitude: 103.8590,
      alternateNames: 'Arab Street, Kampong Glam',
      locationType: 'street',
      isPopular: true
    },
    {
      name: 'Serangoon Gardens',
      postalCode: '555933',
      postalDistrict: '55',
      area: 'North East',
      latitude: 1.3643,
      longitude: 103.8650,
      alternateNames: 'Chomp Chomp, myVillage',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Katong',
      postalCode: '428736',
      postalDistrict: '42',
      area: 'East',
      latitude: 1.3040,
      longitude: 103.9022,
      alternateNames: 'East Coast, Marine Parade',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Joo Chiat',
      postalCode: '427356',
      postalDistrict: '42',
      area: 'East',
      latitude: 1.3159,
      longitude: 103.9022,
      alternateNames: 'Joo Chiat Road, East Coast',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Bukit Timah',
      postalCode: '269698',
      postalDistrict: '26',
      area: 'Central West',
      latitude: 1.3294,
      longitude: 103.8021,
      alternateNames: 'Bukit Timah Road, Beauty World',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Neil Road',
      postalCode: '088810',
      postalDistrict: '08',
      area: 'Chinatown',
      latitude: 1.2797,
      longitude: 103.8399,
      alternateNames: 'Outram, Tanjong Pagar',
      locationType: 'street',
      isPopular: true
    },
    {
      name: 'Novena',
      postalCode: '307683',
      postalDistrict: '30',
      area: 'Central',
      latitude: 1.3199,
      longitude: 103.8434,
      alternateNames: 'Novena Square, Velocity',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Siglap',
      postalCode: '455859',
      postalDistrict: '45',
      area: 'East',
      latitude: 1.3099,
      longitude: 103.9199,
      alternateNames: 'Upper East Coast, Siglap Road',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Clementi',
      postalCode: '129588',
      postalDistrict: '12',
      area: 'West',
      latitude: 1.3155,
      longitude: 103.7649,
      alternateNames: 'Clementi Mall, West Coast',
      locationType: 'district',
      isPopular: false
    },
    {
      name: 'Telok Ayer',
      postalCode: '068815',
      postalDistrict: '06',
      area: 'CBD',
      latitude: 1.2794,
      longitude: 103.8491,
      alternateNames: 'Telok Ayer Street, Amoy Street',
      locationType: 'street',
      isPopular: true
    },
    // Dhoby Ghaut is already defined above in the Orchard Area section
    
    {
      name: 'Geylang',
      postalCode: '389697',
      postalDistrict: '38',
      area: 'East',
      latitude: 1.3187,
      longitude: 103.8896,
      alternateNames: 'Geylang Road, Aljunied',
      locationType: 'district',
      isPopular: false
    },
    {
      name: 'Upper Thomson',
      postalCode: '574408',
      postalDistrict: '57',
      area: 'North',
      latitude: 1.3543,
      longitude: 103.8305,
      alternateNames: 'Thomson Road, Thomson Plaza',
      locationType: 'district',
      isPopular: true
    },
    {
      name: 'Punggol',
      postalCode: '828761',
      postalDistrict: '82',
      area: 'North East',
      latitude: 1.3984,
      longitude: 103.9072,
      alternateNames: 'Punggol Waterway, Waterway Point',
      locationType: 'district',
      isPopular: false
    },
    {
      name: 'Kallang',
      postalCode: '339147',
      postalDistrict: '33',
      area: 'Central',
      latitude: 1.3114,
      longitude: 103.8713,
      alternateNames: 'Stadium, Leisure Park Kallang',
      locationType: 'district',
      isPopular: false
    }
  ];
  
  // Bulk insert data
  for (const location of initialLocations) {
    await db.insert(singaporeLocations).values({
      name: location.name,
      postalcode: location.postalCode,
      postaldistrict: location.postalDistrict,
      area: location.area,
      latitude: location.latitude,
      longitude: location.longitude,
      alternatenames: location.alternateNames,
      locationtype: location.locationType,
      ispopular: location.isPopular,
      createdat: new Date(),
      updatedat: new Date()
    });
  }
  
  console.log(`Inserted ${initialLocations.length} locations`);
}

// Run the function
createAndSeedLocations()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });