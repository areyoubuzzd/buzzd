/**
 * Database Consistency Verification Script
 * 
 * This script verifies that the database follows the required guidelines for:
 * 1. Happy Hours Nearby collection having 25 deals
 * 2. Collection priorities being set correctly
 * 3. Deal sorting logic being applied properly
 * 
 * Run with: npx tsx scripts/verify-database-consistency.ts
 */

import { db } from '../server/db';
import { collections, deals, establishments } from '../shared/schema';
import { eq, like, count, sql } from 'drizzle-orm';
import { exit } from 'process';

async function main() {
  console.log('🔍 Running Database Consistency Verification');
  console.log('===========================================');
  
  let hasErrors = false;
  
  // 1. Check Happy Hours Nearby collection
  console.log('\n📊 Checking "Happy Hours Nearby" collection...');
  
  // Check if active_happy_hours collection exists
  const activeCollection = await db.select()
    .from(collections)
    .where(eq(collections.slug, 'active_happy_hours'))
    .limit(1);
    
  if (activeCollection.length === 0) {
    console.log('❌ ERROR: "active_happy_hours" collection does not exist in the database');
    console.log('   Run scripts/post-data-refresh.ts to create it');
    hasErrors = true;
  } else {
    console.log('✅ "active_happy_hours" collection exists');
    
    // Check that active_happy_hours has priority 1
    if (activeCollection[0].priority !== 1) {
      console.log('❌ ERROR: "active_happy_hours" collection has priority', activeCollection[0].priority, 'instead of 1');
      console.log('   Update the priority in the database to 1');
      hasErrors = true;
    } else {
      console.log('✅ "active_happy_hours" has correct priority (1)');
    }
    
    // Check number of deals in active_happy_hours
    const [result] = await db.select({ 
      count: count() 
    })
    .from(deals)
    .where(sql`${deals.collections} LIKE ${'%active_happy_hours%'}`);
    
    const dealCount = Number(result.count);
    
    if (dealCount === 0) {
      console.log('❌ ERROR: No deals found in "active_happy_hours" collection');
      console.log('   Run scripts/post-data-refresh.ts to add deals');
      hasErrors = true;
    } else if (dealCount < 25) {
      console.log('⚠️ WARNING: Only', dealCount, 'deals in "active_happy_hours" (target is 25)');
      console.log('   This is only acceptable if fewer than 25 deals exist within 10km radius');
      console.log('   Otherwise, run scripts/post-data-refresh.ts to add more deals');
    } else if (dealCount === 25) {
      console.log('✅ "active_happy_hours" has exactly 25 deals as expected');
    } else if (dealCount > 25) {
      console.log('⚠️ WARNING:', dealCount, 'deals in "active_happy_hours" (target is 25)');
      console.log('   Having more than 25 deals may affect performance');
    }
  }
  
  // 2. Check collection priorities
  console.log('\n📊 Checking collection priorities...');
  
  const allCollections = await db.select().from(collections).orderBy(collections.priority);
  
  // Define expected priority ranges for collections
  const expectedPriorities: Record<string, [number, number]> = {
    'active_happy_hours': [1, 1],
    'all_deals': [2, 2],
    'beers_under_12': [10, 13],
    'wines_under_12': [10, 13],
    'cocktails_under_12': [10, 13],
    '1for1_deals': [15, 19],
    'freeflow_deals': [15, 19],
    'cocktails_under_15': [20, 22],
    'wines_under_15': [20, 22],
    'beer_buckets': [22, 25],
    'beers_under_15': [25, 30],
    'whisky_deals': [40, 41],
    'gin_deals': [40, 41]
  };
  
  // Check each collection against expected priorities
  for (const collection of allCollections) {
    const slug = collection.slug;
    const priority = collection.priority;
    
    // Find matching expected priority
    let matched = false;
    for (const [expectedSlug, [min, max]] of Object.entries(expectedPriorities)) {
      if (slug.includes(expectedSlug)) {
        matched = true;
        if (priority < min || priority > max) {
          console.log(`❌ ERROR: Collection "${collection.name}" (${slug}) has priority ${priority}, should be between ${min}-${max}`);
          hasErrors = true;
        } else {
          console.log(`✅ Collection "${collection.name}" has correct priority (${priority})`);
        }
        break;
      }
    }
    
    if (!matched) {
      console.log(`ℹ️ Collection "${collection.name}" (${slug}) has priority ${priority} - no specific requirement`);
    }
  }
  
  // 3. Check for establishments with no deals
  console.log('\n📊 Checking for establishments with no deals...');
  
  const establishmentsWithNoDeals = await db
    .select({
      id: establishments.id,
      name: establishments.name
    })
    .from(establishments)
    .leftJoin(deals, eq(establishments.id, deals.establishmentId))
    .where(sql`${deals.id} IS NULL`);
  
  if (establishmentsWithNoDeals.length > 0) {
    console.log(`⚠️ WARNING: Found ${establishmentsWithNoDeals.length} establishments with no deals:`);
    establishmentsWithNoDeals.forEach(est => {
      console.log(`   - ${est.name} (ID: ${est.id})`);
    });
  } else {
    console.log('✅ All establishments have at least one deal');
  }
  
  // 4. Check for deals with invalid sort_order
  console.log('\n📊 Checking for deals with invalid sort_order...');
  
  const dealsWithMissingSortOrder = await db
    .select({
      count: count()
    })
    .from(deals)
    .where(sql`${deals.sort_order} IS NULL`);
  
  if (Number(dealsWithMissingSortOrder[0].count) > 0) {
    console.log(`❌ ERROR: Found ${dealsWithMissingSortOrder[0].count} deals with missing sort_order`);
    console.log('   Run scripts/post-data-refresh.ts to add sort_order to these deals');
    hasErrors = true;
  } else {
    console.log('✅ All deals have a sort_order value');
  }
  
  // Final summary
  console.log('\n===========================================');
  if (hasErrors) {
    console.log('❌ FAILED: Database has consistency issues that need to be fixed');
    console.log('   Run scripts/post-data-refresh.ts to fix most of these issues');
    exit(1);
  } else {
    console.log('✅ SUCCESS: Database consistency checks passed');
  }
}

main().catch((error) => {
  console.error('Error running verification:', error);
  exit(1);
});