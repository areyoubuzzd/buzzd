/**
 * Simple Deployment Server for Buzzd App
 * This avoids complex build processes and focuses on reliability
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 5000;

console.log(`
=================================================
  BUZZD DEPLOYMENT SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}
Current Directory: ${process.cwd()}
=================================================
`);

// Create a simple HTML landing page
const landingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buzzd - Singapore Happy Hour Deals</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #e63946; margin-bottom: 0.5rem; font-size: 2.5rem; }
    p { margin: 0.5rem 0; }
    .subtitle { font-size: 1.2rem; color: #457b9d; margin-bottom: 1.5rem; }
    .message { background: #f1faee; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card { 
      background: white; 
      border-radius: 0.5rem; 
      padding: 1rem; 
      margin: 1rem 0; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: inline-block;
      margin: 0.5rem;
      width: 40%;
    }
    .drinks { display: flex; flex-wrap: wrap; justify-content: center; margin: 1rem 0; }
    .signature { font-style: italic; margin-top: 2rem; color: #1d3557; }
    @media (max-width: 600px) {
      .card { width: 100%; }
    }
  </style>
</head>
<body>
  <h1>Buzzd</h1>
  <p class="subtitle">Singapore's Happy Hour Deals App</p>
  
  <div class="message">
    <p><strong>Find the best happy hour deals in Singapore!</strong></p>
    <p>Discover great deals on drinks and food around you.</p>
  </div>
  
  <p>Find great deals on:</p>
  
  <div class="drinks">
    <div class="card">
      <p>🍺</p>
      <p>Beer</p>
    </div>
    <div class="card">
      <p>🍷</p>
      <p>Wine</p>
    </div>
    <div class="card">
      <p>🍸</p>
      <p>Cocktails</p>
    </div>
    <div class="card">
      <p>🥃</p>
      <p>Spirits</p>
    </div>
  </div>
  
  <p>The app is also available at:</p>
  <p><a href="https://3ba57093-d855-4595-8517-8bf472da2d09-00-10dy66ta88a3h.riker.replit.dev/" target="_blank">Development Version</a></p>
  
  <p class="signature">© Buzzd 2025</p>
</body>
</html>`;

// Write this to a file
fs.writeFileSync('index.html', landingHtml);

// Serve the static HTML file and any assets
app.use(express.static('.'));

// Start the API server if needed (optional for landing page)
try {
  console.log(`Starting API server on port ${API_PORT}...`);
  const apiProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: API_PORT.toString() }
  });

  apiProcess.on('error', (err) => {
    console.error('Failed to start API server:', err);
  });
} catch (error) {
  console.error('Error starting API server:', error);
}

// For all other routes, serve the static HTML
app.get('*', (req, res) => {
  res.sendFile(path.resolve('index.html'));
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
=================================================
  SERVER STARTED
=================================================
Server listening on: http://localhost:${PORT}
=================================================
`);
});