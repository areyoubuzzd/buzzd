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
import { eq, sql, desc, asc, and, or, like, inArray, not } from 'drizzle-orm';

/**
 * Update all collections with CORRECT priority values
 * 
 * CRITICAL: These priorities determine the order collections appear on the home page.
 * DO NOT MODIFY THESE VALUES without updating the DATABASE_REFRESH_CHECKLIST.md
 */
async function updateCollectionPriorities() {
  console.log('Updating collection priorities to exact client specifications...');

  // MANDATORY PRIORITY MAPPING - DO NOT CHANGE THESE VALUES
  // These values are specified by the client and must remain consistent
  const priorityMapping = [
    // TOP PRIORITY - Always first
    { slug: 'active_happy_hours', priority: 1 },
    
    // SECOND PRIORITY - Always second
    { slug: 'all_deals', priority: 2 },
    
    // PRICE-BASED BEER COLLECTIONS (10-13)
    { slug: 'beers_under_12', priority: 10 },
    { slug: 'beers_under_15', priority: 11 },
    { slug: 'craft_beers', priority: 12 },
    { slug: 'beer_buckets_under_40', priority: 13 },
    
    // SPECIAL DEAL TYPES (15-19)
    { slug: 'one_for_one_deals', priority: 15 },
    { slug: '1for1_deals', priority: 15 }, // Alternate slug
    { slug: 'free_flow_deals', priority: 16 },
    { slug: 'freeflow_deals', priority: 16 }, // Alternate slug
    
    // PRICE-BASED WINE/COCKTAIL COLLECTIONS (20-22)
    { slug: 'cocktails_under_15', priority: 20 },
    { slug: 'wines_under_15', priority: 21 },
    
    // BEER BUCKETS (22-25)
    { slug: 'beer_buckets', priority: 22 },
    { slug: 'beer_bucket', priority: 22 }, // Alternate slug
    
    // ADDITIONAL BEER COLLECTIONS (25-30)
    { slug: 'beers_under_15', priority: 25 },
    
    // SPIRIT COLLECTIONS (40-41)
    { slug: 'whisky_deals', priority: 40 },
    { slug: 'whiskey_deals', priority: 40 }, // Alternate spelling
    { slug: 'gin_deals', priority: 41 },
    
    // ALL DEALS IS DUPLICATED WITH HIGH PRIORITY (60)
    // This is intentional to ensure it appears in a specific position
    { slug: 'all_deals', priority: 60 },
    
    // Any other collections will have lower priority
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
 * Check if a deal is active now based on valid_days, hh_start_time, and hh_end_time
 */
function isDealActiveNow(deal: any): boolean {
  const now = new Date();
  
  // Get Singapore time
  const sgOptions = { timeZone: 'Asia/Singapore' };
  const sgTime = new Date(now.toLocaleString('en-US', sgOptions));
  
  // Get day of week in Singapore time (0 = Sunday, 1 = Monday, etc.)
  const currentDay = sgTime.getDay();
  const daysMap = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday', 
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  };
  const currentDayName = daysMap[currentDay as keyof typeof daysMap];
  
  // Check if today is in the valid days (case insensitive)
  const validDaysLower = deal.valid_days.toLowerCase();
  
  // Case 1: Direct matches for "all days" or "everyday"
  let dayMatches = false;
  if (validDaysLower === 'all days' || 
      validDaysLower.includes('everyday') || 
      validDaysLower.includes('all')) {
    dayMatches = true;
  } 
  // Case 2: Exact day name is included
  else if (validDaysLower.includes(currentDayName)) {
    dayMatches = true;
  }
  // Case 3: Check for day ranges like "mon-fri", "mon-thu", etc.
  else if (validDaysLower.includes('-')) {
    const dayParts = validDaysLower.split('-');
    if (dayParts.length === 2) {
      // Get numeric day values
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const startDayValue = days.findIndex(d => dayParts[0].trim().toLowerCase().startsWith(d));
      const endDayValue = days.findIndex(d => dayParts[1].trim().toLowerCase().startsWith(d));
      
      if (startDayValue !== -1 && endDayValue !== -1) {
        // Check if current day is within range
        dayMatches = currentDay >= startDayValue && currentDay <= endDayValue;
      }
    }
  }
  
  if (!dayMatches) {
    return false;
  }
  
  // Current time in minutes since midnight
  const currentHours = sgTime.getHours();
  const currentMinutes = sgTime.getMinutes();
  const currentTimeMinutes = currentHours * 60 + currentMinutes;
  
  // Parse start time, handling both "14:30" and "1430" formats
  let startTimeMinutes = 0;
  try {
    if (deal.hh_start_time.includes(':')) {
      const [startHours, startMinutes] = deal.hh_start_time.split(':').map(n => parseInt(n, 10));
      startTimeMinutes = startHours * 60 + startMinutes;
    } else {
      // Format like "1430" for 2:30pm
      const hours = Math.floor(parseInt(deal.hh_start_time) / 100);
      const minutes = parseInt(deal.hh_start_time) % 100;
      startTimeMinutes = hours * 60 + minutes;
    }
  } catch (e) {
    console.warn(`Error parsing start time "${deal.hh_start_time}" for deal ${deal.id}:`, e);
    return false;
  }
  
  // Parse end time, handling both "19:00" and "1900" formats
  let endTimeMinutes = 0;
  try {
    if (deal.hh_end_time.includes(':')) {
      const [endHours, endMinutes] = deal.hh_end_time.split(':').map(n => parseInt(n, 10));
      endTimeMinutes = endHours * 60 + endMinutes;
    } else {
      // Format like "1900" for 7:00pm
      const hours = Math.floor(parseInt(deal.hh_end_time) / 100);
      const minutes = parseInt(deal.hh_end_time) % 100;
      endTimeMinutes = hours * 60 + minutes;
    }
  } catch (e) {
    console.warn(`Error parsing end time "${deal.hh_end_time}" for deal ${deal.id}:`, e);
    return false;
  }
  
  // Check if current time is within happy hour
  // Handle normal case (start time before end time) and overnight case (start time after end time)
  if (startTimeMinutes <= endTimeMinutes) {
    // Normal case: e.g. 17:00 - 20:00
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  } else {
    // Overnight case: e.g. 22:00 - 02:00
    return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
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
    
    // Get additional deals that might be good candidates (not already in active_happy_hours)
    const additionalDeals = await db
      .select({
        deal: deals,
        establishment: establishments
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id))
      .where(
        not(sql`${deals.collections} LIKE ${'%active_happy_hours%'}`)
      )
      .limit(100); // Get a good pool of candidates
    
    // Process deals to find the best ones to add
    const dealsToAdd = additionalDeals
      .map(item => ({
        ...item.deal,
        establishment: item.establishment,
        // Check if deal is active now using our function
        isActive: isDealActiveNow(item.deal)
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
 * Update deal sorting info for metadata fields in the database
 * This adds a special column to track which deals should appear first in collections
 */
async function updateDealSortingInfo() {
  console.log('Updating deal sorting information...');
  
  try {
    // First, we'll modify the database table to add the sort_order column if needed
    try {
      // Check if sort_order column exists in the deals table
      const result = await db.execute(
        sql`SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'deals' AND column_name = 'sort_order'`
      );
      
      // If column doesn't exist, add it
      if (result.rows.length === 0) {
        console.log('Adding sort_order column to deals table...');
        await db.execute(sql`ALTER TABLE deals ADD COLUMN sort_order INTEGER`);
      }
    } catch (err) {
      console.error('Error checking or adding sort_order column:', err);
      // Continue with the rest of the function even if this fails
    }
    
    // Get all deals with their establishments
    const allDeals = await db
      .select({
        deal: deals,
        establishment: establishments
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id));
    
    console.log(`Processing ${allDeals.length} deals for sorting information...`);
    
    // Update deals with their sort order values
    for (let i = 0; i < allDeals.length; i++) {
      try {
        const deal = allDeals[i].deal;
        
        // Check if deal is active now
        const isActive = isDealActiveNow(deal);
        
        // Assign a sort order value:
        // 1-100: Active deals (with ascending happy_hour_price)
        // 101-200: Inactive deals (with ascending happy_hour_price)
        const sortOrder = isActive 
          ? Math.min(Math.floor(deal.happy_hour_price || 50), 99) 
          : 100 + Math.min(Math.floor(deal.happy_hour_price || 50), 99);
        
        // Update the deal's sort_order field
        await db.execute(
          sql`UPDATE deals SET sort_order = ${sortOrder} WHERE id = ${deal.id}`
        );
        
        // Progress log for every 10 deals
        if (i % 10 === 0) {
          console.log(`Updated ${i} of ${allDeals.length} deals...`);
        }
      } catch (err) {
        console.error(`Error updating deal ID ${allDeals[i].deal.id}:`, err);
      }
    }
    
    console.log('Successfully updated deal sorting information');
  } catch (error) {
    console.error('Error updating deal sorting information:', error);
  }
}

/**
 * Check if a column exists in a table
 */
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = ${tableName}
      AND column_name = ${columnName}
    `);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in table ${tableName}:`, error);
    return false;
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