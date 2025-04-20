/**
 * Prepare for deployment by creating necessary files in the correct locations.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing for deployment...');

// First build the project
console.log('Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Create server.js file in the root directory
console.log('Creating server.js...');
const serverCode = `
// Deployment server for Buzzd App
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Log environment information
console.log('Starting Buzzd deployment server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', __dirname);
console.log('Files in current directory:', fs.readdirSync(__dirname).join(', '));

// Ensure dist directory exists
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('dist directory exists. Contents:', fs.readdirSync(path.join(__dirname, 'dist')).join(', '));
} else {
  console.log('WARNING: dist directory does NOT exist!');
}

// Ensure client directory exists
if (fs.existsSync(path.join(__dirname, 'client'))) {
  console.log('client directory exists. Contents:', fs.readdirSync(path.join(__dirname, 'client')).join(', '));
} else {
  console.log('WARNING: client directory does NOT exist!');
}

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Start server in the dist directory
try {
  console.log('Attempting to start server from dist directory...');
  // Try to use the built server if it exists
  if (fs.existsSync(path.join(__dirname, 'dist/index.js'))) {
    console.log('Starting built server from dist/index.js');
    require('./dist/index.js');
  } else {
    console.log('Built server not found, falling back to development mode');
    const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      shell: true
    });
    
    serverProcess.on('error', (error) => {
      console.error('Failed to start server process:', error);
    });
  }
} catch (error) {
  console.error('Error starting the server:', error);
}

// For client-side routing - all routes that don't start with /api go to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    console.log('Serving index.html for path:', req.path);
    const indexPath = path.join(__dirname, 'client/index.html');
    
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    } else {
      console.error('ERROR: index.html not found at', indexPath);
      return res.status(404).send(\`
        <h1>Buzzd App</h1>
        <p>Error: Could not find index.html</p>
        <p>Path checked: \${indexPath}</p>
        <p>Current directory: \${__dirname}</p>
        <p>Files in current directory: \${fs.readdirSync(__dirname).join(', ')}</p>
      \`);
    }
  }
});

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Express server listening on port \${PORT}\`);
  console.log(\`Application should be accessible at http://localhost:\${PORT}\`);
});
`;

fs.writeFileSync('server.js', serverCode);
console.log('✅ server.js created successfully');

// Copy the index.html to client directory to ensure it's found
console.log('Ensuring client directory exists...');
if (!fs.existsSync('client')) {
  fs.mkdirSync('client', { recursive: true });
}

console.log('🏁 Deployment preparation complete!');
console.log('\nIMPORTANT INSTRUCTIONS:');
console.log('1. Run this script before deploying: node prepare-deploy.cjs');
console.log('2. When deploying, set the Run command to: node server.js');
console.log('3. Keep the Build command as: npm run build');
console.log('\nFollow these steps exactly to ensure your app will work in deployment.');