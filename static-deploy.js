/**
 * Ultra-minimalist static deployment server for Buzzd App
 * This approach creates a completely static deployment with no build step
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

console.log('BUZZD STATIC DEPLOYMENT SERVER');
console.log('Current directory:', process.cwd());
console.log('Files in current directory:', fs.readdirSync('.').join(', '));

// Create a minimal index.html if it doesn't exist
const indexPath = path.join(__dirname, 'index.html');
if (!fs.existsSync(indexPath)) {
  const minimalHtml = `<!DOCTYPE html>
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
    }
    h1 { color: #e63946; margin-bottom: 0.5rem; }
    p { margin: 0.5rem 0; }
    .subtitle { font-size: 1.2rem; color: #457b9d; margin-bottom: 1.5rem; }
    .message { background: #f1faee; padding: 1rem; border-radius: 0.5rem; margin: 1.5rem 0; }
    .signature { font-style: italic; margin-top: 2rem; color: #1d3557; }
  </style>
</head>
<body>
  <h1>Buzzd</h1>
  <p class="subtitle">Singapore's Happy Hour Deals App</p>
  
  <div class="message">
    <p>Coming soon to this location!</p>
    <p>Discover the best happy hour deals in Singapore.</p>
  </div>
  
  <p>Find deals on:</p>
  <p>🍺 Beer • 🍷 Wine • 🍸 Cocktails • 🥃 Spirits</p>
  
  <p class="signature">© Buzzd 2025</p>
</body>
</html>`;
  fs.writeFileSync(indexPath, minimalHtml);
  console.log('Created minimal index.html');
}

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve any additional assets if they exist
['public', 'assets', 'images'].forEach(dir => {
  if (fs.existsSync(dir)) {
    app.use('/' + dir, express.static(dir));
    console.log(`Serving assets from ${dir}`);
  }
});

// Start the API server
console.log('Starting API server...');
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

serverProcess.on('error', (err) => {
  console.error('API server error:', err);
});

// For client-side routing, all non-API routes go to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(indexPath);
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});