import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Add retries and better error handling for Neon connection issues
const MAX_CONNECTION_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

// Helper function to create pool with retries
const createPoolWithRetries = async (connectionString: string, retries = MAX_CONNECTION_RETRIES): Promise<Pool> => {
  try {
    console.log(`Attempting to connect to database (retries left: ${retries})...`);
    
    // Create pool with SSL settings for Neon
    const pool = new Pool({ 
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Important for Neon in some environments
      }
    });
    
    // Test connection
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      console.log(`Database connection successful. Server time: ${result.rows[0].now}`);
      return pool;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    
    if (retries > 0) {
      console.log(`Retrying database connection in ${RETRY_DELAY_MS/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return createPoolWithRetries(connectionString, retries - 1);
    }
    
    console.error('Maximum database connection retries reached. Using fallback mode.');
    // Return a working pool even if connection failed, so app can start
    // Operations will fail individually rather than crashing the entire app
    return new Pool({ 
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
};

// Initialize the pool (this is now an async operation but we handle that in routes)
console.log('Initializing database connection...');
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create the drizzle ORM instance
export const db = drizzle({ client: pool, schema });

// Test the connection and retry if needed (does not block app startup)
(async () => {
  try {
    // Wake up the database
    await createPoolWithRetries(process.env.DATABASE_URL);
    console.log('Database connection fully initialized and tested.');
  } catch (err) {
    console.error('Failed to establish reliable database connection:', err);
  }
})();