/**
 * Simplified Production Server for Buzzd App
 * 
 * This single file provides:
 * 1. Database connection with retry logic
 * 2. Express server for API and frontend
 * 3. Proper error handling for Neon Postgres
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const schema = require('./shared/schema');
const session = require('express-session');
const connectPg = require('connect-pg-simple');
const ws = require('ws');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Neon database connection
const connectToDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Create PostgreSQL connection with retries
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 2000; // 2 seconds

  let retries = 0;
  let pool;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`Attempting to connect to database (attempt ${retries + 1}/${MAX_RETRIES})...`);
      
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      // Test the connection
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      
      console.log(`✅ Database connected successfully. Time: ${result.rows[0].now}`);
      return pool;
    } catch (error) {
      retries++;
      console.error(`❌ Database connection failed: ${error.message}`);
      
      if (retries >= MAX_RETRIES) {
        console.error('❌ Maximum connection attempts reached. Unable to connect to database.');
        throw error;
      }
      
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

// Setup database connection, API routes, and start server
(async () => {
  try {
    // Connect to the database
    const pool = await connectToDatabase();
    const db = drizzle({ client: pool, schema });
    
    // Setup session store with PostgreSQL
    const PostgresStore = connectPg(session);
    const sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
    
    // Configure session middleware
    app.use(session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'buzzd-default-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      }
    }));
    
    // Import and set up routes dynamically
    const setupRoutes = async () => {
      // Import the routes module
      const { default: routes } = await import('./server/routes.ts');
      
      // Register API routes
      routes(app, db);
      
      console.log('✅ API routes registered');
    };
    
    await setupRoutes();
    
    // Serve static files from the public directory if it exists
    const publicDir = path.join(__dirname, 'dist');
    if (fs.existsSync(publicDir)) {
      app.use(express.static(publicDir));
      console.log('✅ Serving static files from', publicDir);
    }
    
    // Fallback route for SPA
    app.get('*', (req, res) => {
      // If the URL starts with /api, return 404 as it's an unknown API endpoint
      if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      // For frontend routes, serve the index.html file if it exists
      const indexPath = path.join(__dirname, 'dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      
      // If no index.html exists, serve a basic HTML page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Buzzd App</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #ff9b42; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Buzzd App</h1>
          <div class="card">
            <h2>API Server Running</h2>
            <p>The API server is running successfully, but no frontend build was found.</p>
            <p>Server time: ${new Date().toISOString()}</p>
          </div>
        </body>
        </html>
      `);
    });
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
=============================================
  BUZZD APP SERVER RUNNING
=============================================
✅ Server listening on http://0.0.0.0:${PORT}
✅ Database connected
✅ Environment: ${process.env.NODE_ENV || 'development'}
=============================================
      `);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();