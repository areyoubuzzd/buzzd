/**
 * Ultra-simple, reliable deployment server for Buzzd
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// DIAGNOSTIC LOGGING
console.log('🔍 DEPLOYMENT DIAGNOSTICS');
console.log('Current directory:', __dirname);
console.log('Parent directory:', path.resolve(__dirname, '..'));
console.log('Files in current directory:', fs.readdirSync(__dirname).join(', '));
console.log('Files in parent directory:', fs.readdirSync(path.resolve(__dirname, '..')).join(', '));

// First try to see if we have a client/dist directory from a previous build
const clientDistPath = path.resolve(__dirname, '..', 'client', 'dist');
const clientPath = path.resolve(__dirname, '..', 'client');
let staticPath;

if (fs.existsSync(clientDistPath)) {
  console.log('✅ Found client/dist directory, using it for static files');
  staticPath = clientDistPath;
} else if (fs.existsSync(clientPath)) {
  console.log('✅ Found client directory, using it for static files');
  staticPath = clientPath;
} else {
  console.error('❌ Could not find client directory');
  staticPath = path.resolve(__dirname, '..', 'public');
  console.log('ℹ️ Falling back to public directory for static files');
}

// Serve static files
app.use(express.static(staticPath));
app.use('/assets', express.static(path.resolve(staticPath, 'assets')));

// Check if client/index.html exists
const indexHtmlPath = path.resolve(staticPath, 'index.html');
console.log('Looking for index.html at:', indexHtmlPath);
console.log('Does index.html exist?', fs.existsSync(indexHtmlPath) ? 'Yes' : 'No');

// If index.html doesn't exist, try to copy or create it
if (!fs.existsSync(indexHtmlPath)) {
  console.log('⚠️ index.html not found, attempting to recover...');
  
  // Check if we can find it elsewhere
  const possibleLocations = [
    path.resolve(__dirname, '..', 'index.html'),
    path.resolve(__dirname, '..', 'public', 'index.html'),
    path.resolve(__dirname, '..', 'client', 'index.html')
  ];
  
  let found = false;
  for (const location of possibleLocations) {
    if (fs.existsSync(location)) {
      console.log(`Found index.html at ${location}, copying to ${indexHtmlPath}`);
      fs.mkdirSync(path.dirname(indexHtmlPath), { recursive: true });
      fs.copyFileSync(location, indexHtmlPath);
      found = true;
      break;
    }
  }
  
  if (!found) {
    console.log('⚠️ Could not find index.html anywhere, creating a minimal version');
    const minimalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buzzd - Happy Hour Deals</title>
</head>
<body>
  <div id="root">
    <h1>Buzzd</h1>
    <p>Loading application...</p>
    <p>If you see this page, there was an issue loading the application resources.</p>
  </div>
</body>
</html>
    `;
    fs.mkdirSync(path.dirname(indexHtmlPath), { recursive: true });
    fs.writeFileSync(indexHtmlPath, minimalHtml);
  }
}

// Run the API server in a separate process
console.log('Starting API server...');
const serverPath = path.resolve(__dirname, '..', 'server', 'index.ts');
console.log('Server path:', serverPath);
console.log('Does server path exist?', fs.existsSync(serverPath) ? 'Yes' : 'No');

try {
  // Start the server using tsx for TypeScript support
  const serverProcess = exec(`cd ${path.resolve(__dirname, '..')} && npx tsx ${serverPath}`, {
    env: { 
      ...process.env, 
      PORT: '3001',  // Different port for API server
      NODE_ENV: 'production' 
    }
  });

  // Log server output
  serverProcess.stdout.on('data', (data) => {
    console.log(`API server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`API server error: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`API server process exited with code ${code}`);
  });
} catch (error) {
  console.error('Failed to start API server:', error);
}

// For client-side routing - all non-API routes go to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    console.log('Serving index.html for client-side route:', req.path);
    res.sendFile(indexHtmlPath);
  }
});

// Start Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Buzzd deployment server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to view the app`);
});