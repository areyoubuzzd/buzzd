import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { deals } from '../shared/schema.js';
import ws from 'ws';

// Configure Neon for WebSockets
neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a new connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function resetImageIds() {
  try {
    console.log('Clearing image IDs from deals table...');
    
    // Reset all image IDs to null
    const result = await db.update(deals).set({
      imageId: null,
      cloudflareImageId: null,
      cloudinaryImageId: null
    });
    
    console.log('Success! All image IDs have been reset to null.');
    
    // Count how many deals were updated
    const allDeals = await db.select().from(deals);
    console.log(`Total deals in database: ${allDeals.length}`);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error resetting image IDs:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

resetImageIds();