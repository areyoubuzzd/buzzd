/**
 * Script to insert sample data directly into the database
 * Run with: npx tsx server/scripts/insert-sample-data.ts
 */

import { db } from '../db';
import { establishments, deals } from '../../shared/schema';
import { calculateSavingsPercentage } from '../../shared/schema';

async function insertSampleData() {
  try {
    console.log('Inserting sample establishments and deals...');

    // Insert a few sample establishments
    const sampleEstablishments = [
      {
        name: 'The Beer Garden',
        description: 'Relaxed outdoor beer garden with extensive craft beer selection.',
        address: '123 Main Street',
        city: 'Singapore',
        postalCode: '123456',
        latitude: 1.2953,
        longitude: 103.8506,
        rating: 4.5,
        type: 'pub'
      },
      {
        name: 'Wine & Dine',
        description: 'Upscale wine bar offering premium wines and elegant dining.',
        address: '456 Orchard Road',
        city: 'Singapore',
        postalCode: '238877',
        latitude: 1.3050,
        longitude: 103.8321,
        rating: 4.7,
        type: 'wine bar'
      },
      {
        name: 'Cocktail Heaven',
        description: 'Trendy cocktail bar with innovative mixology and vibrant atmosphere.',
        address: '789 Club Street',
        city: 'Singapore',
        postalCode: '069405',
        latitude: 1.2800,
        longitude: 103.8460,
        rating: 4.8,
        type: 'cocktail bar'
      }
    ];

    console.log('Inserting establishments...');
    const insertedEstablishments = [];
    
    for (const establishmentData of sampleEstablishments) {
      // Check if establishment already exists (by name)
      const existingEstablishment = await db.select().from(establishments)
        .where(establishments.name.equals(establishmentData.name));
      
      let result;
      if (existingEstablishment.length > 0) {
        // Update existing establishment
        console.log(`Updating establishment: ${establishmentData.name}`);
        result = await db.update(establishments)
          .set(establishmentData)
          .where(establishments.name.equals(establishmentData.name))
          .returning();
      } else {
        // Insert new establishment
        console.log(`Creating new establishment: ${establishmentData.name}`);
        result = await db.insert(establishments)
          .values(establishmentData)
          .returning();
      }
      
      insertedEstablishments.push(result[0]);
    }
    
    console.log(`Successfully inserted/updated ${insertedEstablishments.length} establishments`);
    
    // Insert sample deals
    const sampleDeals = [
      {
        establishmentId: insertedEstablishments[0].id, // The Beer Garden
        title: 'Happy Hour Beer Special',
        description: 'All draft beers at $10 per pint during happy hour!',
        status: 'active',
        type: 'drink',
        drinkCategory: 'beer',
        drinkSubcategory: 'craft',
        isHousePour: false,
        brand: 'Assorted Craft',
        servingStyle: 'pint',
        servingSize: '1 pint',
        regularPrice: 16.00,
        dealPrice: 10.00,
        savingsPercentage: calculateSavingsPercentage(16.00, 10.00),
        isOneForOne: false,
        startTime: new Date('2025-04-01T16:00:00Z'),
        endTime: new Date('2025-04-01T19:00:00Z'),
        daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
      },
      {
        establishmentId: insertedEstablishments[1].id, // Wine & Dine
        title: 'Wine Wednesday',
        description: 'Half price on selected premium wines every Wednesday',
        status: 'active',
        type: 'drink',
        drinkCategory: 'wine',
        drinkSubcategory: 'red_wine',
        isHousePour: true,
        brand: 'House Selection',
        servingStyle: 'glass',
        servingSize: '150ml',
        regularPrice: 18.00,
        dealPrice: 9.00,
        savingsPercentage: 50,
        isOneForOne: false,
        startTime: new Date('2025-04-01T17:00:00Z'),
        endTime: new Date('2025-04-01T22:00:00Z'),
        daysOfWeek: [3] // Wednesday only
      },
      {
        establishmentId: insertedEstablishments[2].id, // Cocktail Heaven
        title: 'Signature Cocktail 1-for-1',
        description: 'Buy one get one free on all signature cocktails',
        status: 'active',
        type: 'drink',
        drinkCategory: 'cocktail',
        drinkSubcategory: 'signature',
        isHousePour: false,
        brand: 'House Signatures',
        servingStyle: 'glass',
        servingSize: 'Standard',
        regularPrice: 24.00,
        dealPrice: 24.00,
        savingsPercentage: 50,
        isOneForOne: true,
        startTime: new Date('2025-04-01T19:00:00Z'),
        endTime: new Date('2025-04-01T23:00:00Z'),
        daysOfWeek: [4, 5, 6] // Thursday, Friday, Saturday
      }
    ];
    
    console.log('Inserting deals...');
    const insertedDeals = [];
    
    for (const dealData of sampleDeals) {
      // Check if the deal already exists (by title and establishment)
      const existingDeals = await db.select().from(deals)
        .where(deals.title.equals(dealData.title))
        .where(deals.establishmentId.equals(dealData.establishmentId));
      
      let result;
      if (existingDeals.length > 0) {
        // Update existing deal
        console.log(`Updating deal: ${dealData.title}`);
        result = await db.update(deals)
          .set(dealData)
          .where(deals.id.equals(existingDeals[0].id))
          .returning();
      } else {
        // Insert new deal
        console.log(`Creating new deal: ${dealData.title}`);
        result = await db.insert(deals)
          .values(dealData)
          .returning();
      }
      
      insertedDeals.push(result[0]);
    }
    
    console.log(`Successfully inserted/updated ${insertedDeals.length} deals`);
    
    return {
      establishments: insertedEstablishments,
      deals: insertedDeals
    };
  } catch (error) {
    console.error('Error inserting sample data:', error);
    throw error;
  }
}

// Run the script
insertSampleData()
  .then(results => {
    console.log('Sample data insertion complete!');
    console.log(`Inserted ${results.establishments.length} establishments and ${results.deals.length} deals`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to insert sample data:', error);
    process.exit(1);
  });