/**
 * Script to verify the database state and print summary statistics
 * Run with: npx tsx scripts/verify-database.ts
 */
import { db } from '../server/db';
import {
  establishments,
  deals,
  users,
  reviews,
  savedDeals,
  userDealViews,
  collections
} from '../shared/schema';
import { count } from 'drizzle-orm';

async function verifyDatabase() {
  console.log('Verifying database state...');
  
  try {
    // Count establishments
    const [establishmentsCount] = await db
      .select({ count: count() })
      .from(establishments);
    
    console.log(`Establishments: ${establishmentsCount.count}`);
    
    // Get a list of establishments for reporting
    const allEstablishments = await db
      .select({
        id: establishments.id,
        external_id: establishments.external_id,
        name: establishments.name,
        address: establishments.address
      })
      .from(establishments)
      .orderBy(establishments.id);
    
    if (allEstablishments.length > 0) {
      console.log('\nEstablishments in database:');
      for (const est of allEstablishments) {
        console.log(`  [${est.id}] ${est.name}${est.external_id ? ` (${est.external_id})` : ''} - ${est.address || 'No address'}`);
      }
    }
    
    // Count deals
    const [dealsCount] = await db
      .select({ count: count() })
      .from(deals);
    
    console.log(`\nDeals: ${dealsCount.count}`);
    
    // Count deals by establishment
    const dealsByEstablishment = await db
      .select({
        establishmentId: deals.establishmentId,
        count: count()
      })
      .from(deals)
      .groupBy(deals.establishmentId);
    
    if (dealsByEstablishment.length > 0) {
      console.log('\nDeals by establishment:');
      for (const item of dealsByEstablishment) {
        const estInfo = allEstablishments.find(e => e.id === item.establishmentId);
        console.log(`  [${item.establishmentId}] ${estInfo ? estInfo.name : 'Unknown establishment'}: ${item.count} deals`);
      }
    }
    
    // Sample deals from each establishment
    console.log('\nSample deals from each establishment:');
    for (const est of allEstablishments) {
      const estDeals = await db
        .select()
        .from(deals)
        .where({ establishmentId: est.id })
        .limit(3);
      
      if (estDeals.length > 0) {
        console.log(`\n  Establishment: ${est.name}`);
        for (const deal of estDeals) {
          console.log(`    - ${deal.drink_name}: $${deal.happy_hour_price} (${deal.alcohol_category}) [${deal.valid_days}] ${deal.hh_start_time}-${deal.hh_end_time}`);
        }
        
        // If there are more deals than we showed, indicate that
        const totalEstDeals = dealsByEstablishment.find(d => d.establishmentId === est.id)?.count || 0;
        if (totalEstDeals > estDeals.length) {
          console.log(`    ... and ${totalEstDeals - estDeals.length} more deals`);
        }
      } else {
        console.log(`  Establishment: ${est.name} - No deals found`);
      }
    }
    
    // Count other tables if they exist
    try {
      const [usersCount] = await db
        .select({ count: count() })
        .from(users);
      console.log(`\nUsers: ${usersCount.count}`);
    } catch (error) {
      console.log('\nUsers table not accessible or empty');
    }
    
    try {
      const [reviewsCount] = await db
        .select({ count: count() })
        .from(reviews);
      console.log(`Reviews: ${reviewsCount.count}`);
    } catch (error) {
      console.log('Reviews table not accessible or empty');
    }
    
    try {
      const [savedDealsCount] = await db
        .select({ count: count() })
        .from(savedDeals);
      console.log(`Saved deals: ${savedDealsCount.count}`);
    } catch (error) {
      console.log('Saved deals table not accessible or empty');
    }
    
    try {
      const [userDealViewsCount] = await db
        .select({ count: count() })
        .from(userDealViews);
      console.log(`User deal views: ${userDealViewsCount.count}`);
    } catch (error) {
      console.log('User deal views table not accessible or empty');
    }
    
    console.log('\nDatabase verification completed! ✅');
  } catch (error) {
    console.error('Error during database verification:', error);
    process.exit(1);
  }
}

// Run the verification
verifyDatabase().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Failed to verify database:', error);
  process.exit(1);
});