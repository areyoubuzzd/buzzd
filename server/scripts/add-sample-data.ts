import { db } from '../db';
import { deals, establishments } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * This script adds sample establishments and deals with collections data
 * to demonstrate the collections feature.
 */
async function addSampleData() {
  try {
    console.log('Starting to add sample data...');
    
    // Add establishment if it doesn't exist
    let establishment = await db.query.establishments.findFirst({
      where: eq(establishments.name, 'The Sample Bar')
    });
    
    if (!establishment) {
      console.log('Creating sample establishment...');
      const [newEstablishment] = await db.insert(establishments)
        .values({
          name: 'The Sample Bar',
          address: '123 Sample Street',
          city: 'Singapore',
          postalCode: '123456',
          latitude: 1.3521,
          longitude: 103.8198,
          cuisine: 'Bar & Restaurant',
          price: 2,
          priority: 1
        })
        .returning();
      
      establishment = newEstablishment;
      console.log('Created sample establishment with ID:', establishment.id);
    } else {
      console.log('Sample establishment already exists with ID:', establishment.id);
    }
    
    // Add sample deals with collections data
    const sampleDeals = [
      {
        title: 'Budget Tiger Beer',
        description: 'Tiger Beer at happy hour prices',
        establishmentId: establishment.id,
        alcohol_category: 'beer',
        alcohol_subcategory: 'lager',
        drink_name: 'Tiger Beer',
        standard_price: 15.0,
        happy_hour_price: 8.0,
        savings: 7.0,
        savings_percentage: 47,
        valid_days: 'Mon,Tue,Wed,Thu,Fri',
        hh_start_time: '17:00:00',
        hh_end_time: '20:00:00',
        collections: 'beers_under_10',
        imageUrl: 'https://placehold.co/400x400/e6f7ff/0099cc?text=Tiger'
      },
      {
        title: '1-for-1 House Wine',
        description: 'Buy one glass of house wine, get one free',
        establishmentId: establishment.id,
        alcohol_category: 'wine',
        alcohol_subcategory: 'red_wine',
        drink_name: 'House Red Wine',
        standard_price: 18.0,
        happy_hour_price: 18.0, // Same price for 1-for-1
        savings: 18.0,
        savings_percentage: 50,
        valid_days: 'Mon,Tue,Wed,Thu,Fri',
        hh_start_time: '17:00:00',
        hh_end_time: '20:00:00',
        collections: 'one_for_one_deals,wine_deals',
        imageUrl: 'https://placehold.co/400x400/ffebeb/990000?text=Wine'
      },
      {
        title: 'Premium Whiskey',
        description: 'Enjoy premium whiskey at special prices',
        establishmentId: establishment.id,
        alcohol_category: 'spirits',
        alcohol_subcategory: 'whisky',
        drink_name: 'Macallan 12',
        standard_price: 25.0,
        happy_hour_price: 18.0,
        savings: 7.0,
        savings_percentage: 28,
        valid_days: 'Mon,Tue,Wed,Thu,Fri',
        hh_start_time: '17:00:00',
        hh_end_time: '20:00:00',
        collections: 'premium_spirits',
        imageUrl: 'https://placehold.co/400x400/fff2e6/995200?text=Whisky'
      },
      {
        title: 'Happy Hour Cocktails',
        description: 'Signature cocktails at special prices',
        establishmentId: establishment.id,
        alcohol_category: 'cocktail',
        alcohol_subcategory: 'signature',
        drink_name: 'Singapore Sling',
        standard_price: 24.0,
        happy_hour_price: 16.0,
        savings: 8.0,
        savings_percentage: 33,
        valid_days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
        hh_start_time: '17:00:00',
        hh_end_time: '20:00:00',
        collections: 'cocktail_specials',
        imageUrl: 'https://placehold.co/400x400/ffe6e6/cc3333?text=Cocktail'
      },
      {
        title: 'House Spirits',
        description: 'House pour spirits at happy hour prices',
        establishmentId: establishment.id,
        alcohol_category: 'spirits',
        alcohol_subcategory: 'vodka',
        drink_name: 'House Vodka',
        standard_price: 16.0,
        happy_hour_price: 9.0,
        savings: 7.0,
        savings_percentage: 44,
        valid_days: 'Mon,Tue,Wed,Thu,Fri',
        hh_start_time: '17:00:00',
        hh_end_time: '20:00:00',
        collections: 'happy_hour_spirits',
        imageUrl: 'https://placehold.co/400x400/e6e6ff/3333cc?text=Vodka'
      }
    ];
    
    console.log('Adding sample deals with collections data...');
    
    for (const dealData of sampleDeals) {
      // Check if deal already exists
      const existingDeal = await db.query.deals.findFirst({
        where: eq(deals.title, dealData.title)
      });
      
      if (!existingDeal) {
        const [newDeal] = await db.insert(deals)
          .values(dealData)
          .returning();
        
        console.log(`Created deal: ${dealData.title} (ID: ${newDeal.id})`);
      } else {
        // Update with the newest collections data
        await db.update(deals)
          .set({ 
            collections: dealData.collections,
            imageUrl: dealData.imageUrl
          })
          .where(eq(deals.id, existingDeal.id));
        
        console.log(`Updated deal: ${dealData.title} (ID: ${existingDeal.id})`);
      }
    }
    
    console.log('Sample data has been added successfully!');
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
}

// Run the function
addSampleData().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});