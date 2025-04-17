/**
 * Script to seed the collections table with predefined collection metadata
 * Run with: npx tsx scripts/seed-collections.ts
 */
import { db } from '../server/db';
import { collections, insertCollectionSchema, InsertCollection } from '../shared/schema';
import { sql } from 'drizzle-orm';

// Collection metadata with display names, descriptions, and priority
const collectionsData: InsertCollection[] = [
  // Priority collections (lower number = higher priority)
  {
    slug: 'active_happy_hours_nearby',
    name: 'Active Happy Hours Nearby',
    description: 'Happy hour deals active right now near your location',
    priority: 1,
    active: true
  },
  {
    slug: 'beers_under_10',
    name: 'Beers Under $10',
    description: 'Great beer deals under $10',
    priority: 2,
    active: true
  },
  {
    slug: 'cocktails_under_15',
    name: 'Cocktails Under $15',
    description: 'Great cocktail deals under $15',
    priority: 3,
    active: true
  },
  {
    slug: '1-for-1_deal',
    name: '1-for-1 Deals',
    description: 'Buy one, get one free deals',
    priority: 4,
    active: true
  },
  
  // Beer collections
  {
    slug: 'beers_under_5',
    name: 'Beers Under $5',
    description: 'Fantastic deals on beer under $5',
    priority: 10,
    active: true
  },
  {
    slug: 'beer_buckets_under_35',
    name: 'Beer Buckets Under $35',
    description: 'Beer bucket specials under $35',
    priority: 11,
    active: true
  },
  {
    slug: 'craft_beer',
    name: 'Craft Beer Selection',
    description: 'Special prices on craft beers',
    priority: 12,
    active: true
  },
  
  // Wine collections
  {
    slug: 'wines_under_12', 
    name: 'Wines Under $12',
    description: 'Great wine deals under $12',
    priority: 20,
    active: true
  },
  {
    slug: 'wines_under_10',
    name: 'Wines Under $10',
    description: 'Excellent wine deals under $10',
    priority: 21,
    active: true
  },
  {
    slug: 'wine_deals',
    name: 'Wine Deals',
    description: 'Special offers on wine by the glass and bottle',
    priority: 22,
    active: true
  },
  {
    slug: 'premium_wine',
    name: 'Premium Wine Selection',
    description: 'Special prices on premium wines',
    priority: 23,
    active: true
  },
  
  // Cocktail collections
  {
    slug: 'cocktails_under_12',
    name: 'Cocktails Under $12',
    description: 'Excellent cocktail deals under $12',
    priority: 30,
    active: true
  },
  {
    slug: 'cocktail_specials',
    name: 'Cocktail Specials',
    description: 'Signature and classic cocktails at special prices',
    priority: 31,
    active: true
  },
  
  // Spirits collections
  {
    slug: 'happy_hour_spirits',
    name: 'Happy Hour Spirits',
    description: 'Spirits at happy hour prices',
    priority: 40,
    active: true
  },
  {
    slug: 'bottles_under_100',
    name: 'Bottles Under $100',
    description: 'Bottle service under $100',
    priority: 41,
    active: true
  },
  
  // Special deal collections
  {
    slug: 'one_for_one_deals',
    name: '1-for-1 Deals',
    description: 'Buy one, get one free deals',
    priority: 50,
    active: true
  },
  {
    slug: 'one_for_one_beer',
    name: '1-for-1 Beer Deals',
    description: 'Buy one beer, get one free',
    priority: 51,
    active: true
  },
  {
    slug: 'freeflow_deal',
    name: 'Free Flow Deals',
    description: 'Unlimited drink packages',
    priority: 52,
    active: true
  },
  {
    slug: 'weekend_specials',
    name: 'Weekend Specials',
    description: 'Special deals available on weekends',
    priority: 53,
    active: true
  }
];

/**
 * Seed the collections table with predefined data
 */
async function seedCollections() {
  try {
    console.log('Cleaning existing collections data...');
    
    // Clear existing data
    await db.execute(sql`TRUNCATE collections CASCADE`);
    
    console.log('Inserting seed collections...');
    
    // Parse the data with Zod schema to ensure it's valid
    const validatedData = collectionsData.map(collection => {
      try {
        return insertCollectionSchema.parse(collection);
      } catch (error) {
        console.error(`Invalid collection data for ${collection.slug}:`, error);
        return null;
      }
    }).filter(Boolean) as InsertCollection[];
    
    // Insert all collections
    const result = await db.insert(collections).values(validatedData).returning();
    
    console.log(`Successfully seeded ${result.length} collections`);
    console.log('Collection seeding complete!');
    
  } catch (error) {
    console.error('Error seeding collections:', error);
  } finally {
    process.exit();
  }
}

// Run the seed function
seedCollections();