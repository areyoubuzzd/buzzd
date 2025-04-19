/**
 * Post-Data Refresh Utility
 * 
 * This script should run after any data refresh operation to ensure:
 * 1. Proper deal sorting within collections
 * 2. Collection prioritization based on set values
 * 3. Sufficient deals in "Happy Hours Nearby" collection
 * 
 * Run with: npx tsx scripts/post-data-refresh.ts
 */

import { db } from '../server/db';
import { deals, establishments, collections } from '../shared/schema';
import { eq, sql, desc, asc, and, or, like, inArray } from 'drizzle-orm';

/**
 * Update all collections with proper priority values
 */
async function updateCollectionPriorities() {
  console.log('Updating collection priorities...');

  // Define the desired priority order
  const priorityMapping = [
    { slug: 'active_happy_hours', priority: 1 },
    { slug: 'all_deals', priority: 2 },
    
    // Beer collections (10-19)
    { slug: 'beers_under_12', priority: 10 },
    { slug: 'beers_under_15', priority: 11 },
    { slug: 'craft_beers', priority: 12 },
    { slug: 'beer_buckets_under_40', priority: 13 },
    
    // Wine collections (20-29)
    { slug: 'wines_under_12', priority: 20 },
    { slug: 'wines_under_15', priority: 21 },
    { slug: 'bottles_under_100', priority: 22 },
    
    // Cocktail collections (30-39)
    { slug: 'cocktails_under_12', priority: 30 },
    { slug: 'cocktails_under_15', priority: 31 },
    { slug: 'signature_cocktails', priority: 32 },
    
    // Spirit collections (40-49)
    { slug: 'whisky_deals', priority: 40 },
    { slug: 'gin_deals', priority: 41 },
    
    // Special collections (50-59)
    { slug: 'one_for_one_deals', priority: 50 },
    { slug: 'free_flow_deals', priority: 51 },
    { slug: 'two_bottle_discounts', priority: 52 },
    
    // Location collections (60-69)
    { slug: 'cbd_deals', priority: 60 },
    { slug: 'orchard_deals', priority: 61 },
    { slug: 'holland_village_deals', priority: 62 }
  ];

  // Update each collection with its proper priority
  for (const { slug, priority } of priorityMapping) {
    try {
      const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.slug, slug));
      
      if (collection) {
        await db
          .update(collections)
          .set({ priority })
          .where(eq(collections.id, collection.id));
        
        console.log(`Set priority ${priority} for collection "${collection.name}" (${slug})`);
      } else {
        console.log(`Collection "${slug}" not found, skipping priority update`);
      }
    } catch (error) {
      console.error(`Error updating priority for collection ${slug}:`, error);
    }
  }
}

/**
 * Ensure the "active_happy_hours" collection includes at least 25 deals
 * This modifies the deals table to add the "active_happy_hours" collection to more deals if needed
 */
async function ensureMinimumDealsInActiveHappyHours() {
  console.log('Ensuring minimum deals in "Happy Hours Nearby" collection...');
  
  try {
    // Step 1: Get all deals with the active_happy_hours collection
    const dealsWithActiveHappyHours = await db
      .select()
      .from(deals)
      .where(sql`${deals.collections} LIKE ${'%active_happy_hours%'}`);
    
    console.log(`Found ${dealsWithActiveHappyHours.length} deals in "active_happy_hours" collection`);
    
    // Step 2: If we already have at least 25 deals, no action needed
    if (dealsWithActiveHappyHours.length >= 25) {
      console.log('Collection already has at least 25 deals, no action needed');
      return;
    }
    
    // Step 3: Find additional deals to add to the collection
    // Priority: Active deals first, then nearby, then by price
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Get additional deals that might be good candidates
    const additionalDeals = await db
      .select({
        deal: deals,
        establishment: establishments
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id))
      .where(
        and(
          // Exclude deals already in the collection
          sql`${deals.collections} NOT LIKE ${'%active_happy_hours%'}`,
          // Only include deals that have happy hour days
          sql`${deals.happyHourDays} IS NOT NULL`,
        )
      )
      .limit(100); // Get a good pool of candidates
    
    // Process deals to find the best ones to add
    const dealsToAdd = additionalDeals
      .map(item => ({
        ...item.deal,
        establishment: item.establishment,
        // Check if today is a happy hour day
        isDealActiveDay: item.deal.happyHourDays
          ? item.deal.happyHourDays.split(',').map(day => parseInt(day.trim())).includes(currentDay)
          : false,
        // Parse start and end times
        startTimeValue: (() => {
          const startTimeParts = item.deal.startTime ? item.deal.startTime.split(':') : ['0', '0'];
          return parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
        })(),
        endTimeValue: (() => {
          const endTimeParts = item.deal.endTime ? item.deal.endTime.split(':') : ['0', '0'];
          return parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
        })()
      }))
      // Add isActive flag based on day and time
      .map(deal => ({
        ...deal,
        isActive: deal.isDealActiveDay && (currentTime >= deal.startTimeValue && currentTime <= deal.endTimeValue)
      }))
      // Sort by active status first, then by happy hour price
      .sort((a, b) => {
        // First by active status
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        // Then by price
        return (a.happy_hour_price || 999) - (b.happy_hour_price || 999);
      })
      // Take just enough to reach 25 total deals
      .slice(0, 25 - dealsWithActiveHappyHours.length);
    
    console.log(`Selected ${dealsToAdd.length} additional deals to add to the collection`);
    
    // Step 4: Update each deal to add it to the active_happy_hours collection
    for (const deal of dealsToAdd) {
      // Add the collection to the deal's collections field
      const newCollections = deal.collections 
        ? deal.collections + ',active_happy_hours' 
        : 'active_happy_hours';
      
      await db
        .update(deals)
        .set({ collections: newCollections })
        .where(eq(deals.id, deal.id));
      
      console.log(`Added deal ${deal.id} (${deal.drink_name}) to active_happy_hours collection`);
    }
    
    console.log(`Successfully added ${dealsToAdd.length} deals to "active_happy_hours" collection`);
  } catch (error) {
    console.error('Error ensuring minimum deals in Active Happy Hours:', error);
  }
}

/**
 * Update deal sorting info in the database
 * This adds metadata that helps with sorting by active status
 */
async function updateDealSortingInfo() {
  console.log('Updating deal sorting information...');
  
  try {
    // Get current time info
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Get all deals with their establishments
    const allDeals = await db
      .select({
        deal: deals,
        establishment: establishments
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id));
    
    console.log(`Processing ${allDeals.length} deals for sorting information...`);
    
    // Process each deal to update its sorting metadata
    for (const item of allDeals) {
      const deal = item.deal;
      
      // Check if today is a happy hour day
      const happyHourDays = deal.happyHourDays 
        ? deal.happyHourDays.split(',').map(day => parseInt(day.trim())) 
        : [];
      
      const isDealActiveDay = happyHourDays.includes(currentDay);
      
      // Parse start and end times
      const startTimeParts = deal.startTime ? deal.startTime.split(':') : ['0', '0'];
      const endTimeParts = deal.endTime ? deal.endTime.split(':') : ['0', '0'];
      
      const startTimeValue = parseInt(startTimeParts[0]) * 60 + parseInt(startTimeParts[1]);
      const endTimeValue = parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]);
      
      // Check if current time is within happy hour
      const isActiveTime = currentTime >= startTimeValue && currentTime <= endTimeValue;
      
      // Deal is active if both day and time conditions are met
      const isActive = isDealActiveDay && isActiveTime;
      
      // Add a temporary sortOrder field to ensure active deals come first
      // We'll use a simple numbering scheme:
      // 1-100: Active deals (with ascending happy_hour_price)
      // 101-200: Inactive deals (with ascending happy_hour_price)
      const sortOrder = isActive 
        ? (deal.happy_hour_price || 50) 
        : 100 + (deal.happy_hour_price || 50);
      
      // Update the deal with this information
      await db
        .update(deals)
        .set({ 
          // Store whether the deal is active right now
          // Note: This will need to be recalculated regularly
          active: isActive,
          // Store the sort order value 
          sortOrder
        })
        .where(eq(deals.id, deal.id));
    }
    
    console.log('Successfully updated deal sorting information');
  } catch (error) {
    console.error('Error updating deal sorting information:', error);
  }
}

/**
 * Main function to run all post-refresh operations
 */
async function runPostRefreshOperations() {
  console.log('Starting post-data refresh operations...');
  
  try {
    // Update collection priorities
    await updateCollectionPriorities();
    
    // Update deal sorting information
    await updateDealSortingInfo();
    
    // Ensure minimum deals in active happy hours
    await ensureMinimumDealsInActiveHappyHours();
    
    console.log('Post-refresh operations completed successfully!');
  } catch (error) {
    console.error('Error during post-refresh operations:', error);
  } finally {
    process.exit(0);
  }
}

// Run the operations
runPostRefreshOperations();