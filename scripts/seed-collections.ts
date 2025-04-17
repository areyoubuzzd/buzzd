/**
 * Script to seed the collections table with predefined collection metadata
 * Run with: npx tsx scripts/seed-collections.ts
 */

import { db } from '../server/db';
import { collections } from '../shared/schema';
import dotenv from 'dotenv';

dotenv.config();

// Collection definitions with proper metadata
const collectionData = [
  // Top level collections (these appear first)
  {
    slug: 'active_happy_hours',
    name: 'Active Happy Hours',
    description: 'Currently active happy hour deals nearby',
    priority: 1,
    icon: 'clock',
    active: true
  },
  {
    slug: 'all_deals',
    name: 'All Deals',
    description: 'Browse all available deals',
    priority: 2,
    icon: 'list',
    active: true
  },
  
  // Beer collections
  {
    slug: 'beers_under_12',
    name: 'Beers Under $12',
    description: 'Affordable beer deals under $12',
    priority: 10,
    icon: 'beer',
    active: true
  },
  {
    slug: 'beers_under_15',
    name: 'Beers Under $15',
    description: 'Beer deals under $15',
    priority: 11,
    icon: 'beer',
    active: true
  },
  {
    slug: 'craft_beers',
    name: 'Craft Beers',
    description: 'Special deals on craft beers',
    priority: 12,
    icon: 'beer',
    active: true
  },
  {
    slug: 'beer_buckets_under_40',
    name: 'Beer Buckets Under $40',
    description: 'Bucket deals for beer lovers',
    priority: 13,
    icon: 'package',
    active: true
  },
  
  // Wine collections
  {
    slug: 'wines_under_12',
    name: 'Wines Under $12',
    description: 'Affordable wine by the glass',
    priority: 20,
    icon: 'wine',
    active: true
  },
  {
    slug: 'wines_under_15',
    name: 'Wines Under $15',
    description: 'Wine deals under $15 per glass',
    priority: 21,
    icon: 'wine',
    active: true
  },
  {
    slug: 'bottles_under_100',
    name: 'Bottles Under $100',
    description: 'Wine bottle deals under $100',
    priority: 22,
    icon: 'wine',
    active: true
  },
  
  // Cocktail collections
  {
    slug: 'cocktails_under_12',
    name: 'Cocktails Under $12',
    description: 'Affordable cocktail deals',
    priority: 30,
    icon: 'cocktail',
    active: true
  },
  {
    slug: 'cocktails_under_15',
    name: 'Cocktails Under $15',
    description: 'Cocktail deals under $15',
    priority: 31,
    icon: 'cocktail',
    active: true
  },
  {
    slug: 'signature_cocktails',
    name: 'Signature Cocktails',
    description: 'Special deals on signature cocktails',
    priority: 32,
    icon: 'sparkles',
    active: true
  },
  
  // Spirit collections
  {
    slug: 'whisky_deals',
    name: 'Whisky Deals',
    description: 'Special deals on whisky',
    priority: 40,
    icon: 'glass',
    active: true
  },
  {
    slug: 'gin_deals',
    name: 'Gin Deals',
    description: 'Special deals on gin',
    priority: 41,
    icon: 'glass',
    active: true
  },
  
  // Special deal types
  {
    slug: '1for1_deals',
    name: '1-for-1 Deals',
    description: 'Buy one get one free deals',
    priority: 50,
    icon: 'plus',
    active: true
  },
  {
    slug: 'freeflow_deals',
    name: 'Free Flow Deals',
    description: 'All you can drink specials',
    priority: 51,
    icon: 'droplets',
    active: true
  },
  {
    slug: 'two_bottle_discounts',
    name: 'Two Bottle Discounts',
    description: 'Special discounts on multiple bottles',
    priority: 52,
    icon: 'package',
    active: true
  },
  
  // Location-based collections
  {
    slug: 'cbd_deals',
    name: 'CBD Deals',
    description: 'Deals in the Central Business District',
    priority: 60,
    icon: 'building',
    active: true
  },
  {
    slug: 'orchard_deals',
    name: 'Orchard Deals',
    description: 'Deals along Orchard Road',
    priority: 61,
    icon: 'map-pin',
    active: true
  },
  {
    slug: 'holland_village_deals',
    name: 'Holland Village Deals',
    description: 'Deals in Holland Village',
    priority: 62,
    icon: 'map-pin',
    active: true
  }
];

/**
 * Seed the collections table with predefined data
 */
async function seedCollections() {
  try {
    // Clear existing collections
    console.log('Clearing existing collections...');
    await db.delete(collections);
    
    // Insert new collections
    console.log(`Inserting ${collectionData.length} collections...`);
    
    // Insert collections in batches to avoid any potential issues
    const batchSize = 5;
    for (let i = 0; i < collectionData.length; i += batchSize) {
      const batch = collectionData.slice(i, i + batchSize);
      await db.insert(collections).values(batch);
      console.log(`Inserted collections ${i+1} to ${Math.min(i+batchSize, collectionData.length)}`);
    }
    
    // Verify the collections were inserted
    const insertedCollections = await db.select().from(collections);
    console.log(`Successfully inserted ${insertedCollections.length} collections.`);
    
    return insertedCollections;
  } catch (error) {
    console.error('Error seeding collections:', error);
    throw error;
  }
}

// Run the seeding process
seedCollections()
  .then(() => {
    console.log('Collections seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed collections:', error);
    process.exit(1);
  });