/**
 * Buzzd App Deployment Script
 * 
 * This script:
 * 1. Creates a production-ready deployment with combined frontend/API
 * 2. Handles environment variables and database connections
 * 3. Works with the existing Replit deployment system
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log(`
=================================================
  BUZZD DEPLOYMENT PREPARATION
=================================================
Starting deployment preparation at: ${new Date().toISOString()}
Node version: ${process.version}
`);

// Step 1: Build the frontend
console.log('Building frontend...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend build completed');
} catch (error) {
  console.error('❌ Frontend build failed:', error);
  process.exit(1);
}

// Step 2: Compile the deployment-specific server file
console.log('\nCompiling server files for deployment...');
try {
  execSync('npx tsc server/index-deployment.ts --outDir dist/server --esModuleInterop --module NodeNext --moduleResolution NodeNext', { stdio: 'inherit' });
  console.log('✅ Server compilation completed');
} catch (error) {
  console.error('❌ Server compilation failed:', error);
  process.exit(1);
}

// Step 3: Create a production server file
console.log('\nCreating production server file...');
const productionServerContent = `
/**
 * Combined Production Server for Buzzd App
 * Created by deployment script at ${new Date().toISOString()}
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import session from 'express-session';
import MemoryStore from 'memorystore';

// Load environment variables
dotenv.config();

// For Neon Database connection
neonConfig.webSocketConstructor = ws;

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session storage
const SessionStore = MemoryStore(session);
const sessionStore = new SessionStore({
  checkPeriod: 86400000 // 24 hours
});

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || 'buzzd-happy-hour-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Add middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(\`
=================================================
  BUZZD PRODUCTION SERVER (STARTED: \${new Date().toISOString()})
=================================================
Environment: \${process.env.NODE_ENV || 'development'}
Database URL configured: \${process.env.DATABASE_URL ? 'YES' : 'NO'}
=================================================
\`);

// Verify database connection
let dbConnected = false;
if (process.env.DATABASE_URL) {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful:', res.rows[0].now);
    client.release();
    dbConnected = true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
}

// Serve static files from the dist directory
if (fs.existsSync('dist')) {
  app.use(express.static('dist'));
  console.log('✅ Serving static files from dist');
}

// Serve additional static directories
['public', 'dist/client', 'assets', 'images'].forEach(dir => {
  if (fs.existsSync(dir)) {
    app.use('/' + path.basename(dir), express.static(dir));
    console.log(\`✅ Serving additional static files from: \${dir}\`);
  }
});

// Initialize the API routes
console.log('Initializing API routes...');
try {
  const { default: initServer } = await import('./server/index-deployment.js');
  if (typeof initServer === 'function') {
    await initServer(app);
    console.log('✅ API routes initialized successfully');
  } else {
    throw new Error('initServer is not a function');
  }
} catch (err) {
  console.error('❌ Failed to initialize API routes:', err);
}

// Add diagnostic endpoint
app.get('/api/diagnostic', (req, res) => {
  res.json({
    status: 'Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'Connected' : 'Not connected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Default route for client-side routing
app.get('*', (req, res) => {
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  if (fs.existsSync('dist/index.html')) {
    return res.sendFile(path.resolve('dist/index.html'));
  }
  
  res.status(404).send('Not found');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`
=================================================
  SERVER STARTED
=================================================
Server running on: http://0.0.0.0:\${PORT}
Database connection: \${dbConnected ? '✅ Connected' : '❌ Failed'}
=================================================
\`);
});
`;

fs.writeFileSync('production-server.js', productionServerContent);
console.log('✅ Created production-server.js');

// Step 4: Update package.json start script
console.log('\nUpdating package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const oldStartScript = packageJson.scripts.start;
  packageJson.scripts.start = 'NODE_ENV=production node production-server.js';
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log(`✅ Updated start script in package.json:`);
  console.log(`   From: ${oldStartScript}`);
  console.log(`   To:   ${packageJson.scripts.start}`);
} catch (error) {
  console.error('❌ Failed to update package.json:', error);
}

// Step 5: Create deployment configuration file
console.log('\nCreating deployment configuration...');
const deployConfig = {
  run: 'npm start',
  env: {
    NODE_ENV: 'production'
  }
};
fs.writeFileSync('.replit.deploy', JSON.stringify(deployConfig, null, 2));
console.log('✅ Created .replit.deploy configuration');

console.log(`
=================================================
  DEPLOYMENT PREPARATION COMPLETE
=================================================
Your application is now ready for deployment.

To deploy:
1. Go to the "Deployment" tab in Replit
2. Click "Deploy"
3. Your app will be deployed to your custom domain

The database connection will be automatically configured
using the DATABASE_URL environment variable.
=================================================
`);