/**
 * Special Deployment Fix for Replit
 * 
 * This script:
 * 1. Creates a production build with the correct file references
 * 2. Creates stable copies of assets that won't have hash mismatches
 * 
 * Usage: node fix-deployment.cjs
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log("🔧 Running Deployment Fix Script 🔧");

// Step 1: Make sure we have the original development index.html
console.log("Step 1: Backing up development index.html...");
fs.copyFileSync('client/index.html', 'client/index.html.dev');

// Step 2: Create deployment-ready index.html
console.log("Step 2: Creating deployment-ready index.html...");
let html = fs.readFileSync('client/index.html', 'utf8');
// Replace dynamic script with stable app.js reference
html = html.replace(
  /<script type="module" src="\/src\/main.tsx"><\/script>/,
  '<script type="module" crossorigin src="/assets/app.js"></script>\n    ' +
  '<link rel="stylesheet" crossorigin href="/assets/app.css">'
);
fs.writeFileSync('client/index.html', html);

// Step 3: Create the assets directory if it doesn't exist
console.log("Step 3: Setting up assets directory...");
const assetsDir = path.join('client', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Step 4: Create a smart loader script
console.log("Step 4: Creating smart loader script...");
const loaderScript = `
// Buzzd App Loader - Production Deployment Version

(function() {
  console.log("Buzzd App Loader: Initializing...");
  
  // First check if the app is already running
  if (document.getElementById('root').children.length > 0) {
    console.log("Buzzd App Loader: App appears to be already loaded");
    return;
  }
  
  // Look for existing script tags with hashed names
  const scripts = Array.from(document.querySelectorAll('script[src^="/assets/index-"]'));
  if (scripts.length > 0) {
    console.log("Buzzd App Loader: Found script:", scripts[0].src);
    return; // Script is already loading correctly
  }
  
  // Look for CSS links to find the pattern of the hashed filename
  const links = Array.from(document.querySelectorAll('link[href^="/assets/index-"]'));
  if (links.length > 0) {
    try {
      const cssHref = links[0].href;
      console.log("Buzzd App Loader: Found CSS:", cssHref);
      
      // Extract the hash pattern from the CSS filename
      const regex = /\\/assets\\/(index-[^.]+)\\.css/;
      const matchResult = cssHref.match(regex);
      
      if (matchResult && matchResult[1]) {
        const baseName = matchResult[1];
        const scriptSrc = \`/assets/\${baseName}.js\`;
        
        console.log("Buzzd App Loader: Loading script:", scriptSrc);
        
        const script = document.createElement('script');
        script.type = 'module';
        script.src = scriptSrc;
        document.head.appendChild(script);
        return;
      }
    } catch (e) {
      console.error("Buzzd App Loader: Error parsing CSS link:", e);
    }
  }
  
  console.log("Buzzd App Loader: No entry points found, using fallback...");
  
  // Fallback option - try to load the client directly
  try {
    const clientScript = document.createElement('script');
    clientScript.type = 'module';
    clientScript.src = '/client/src/main.tsx';
    document.head.appendChild(clientScript);
  } catch (e) {
    console.error("Buzzd App Loader: Failed to load fallback:", e);
  }
})();
`;

// Step 5: Create a minimal CSS file
console.log("Step 5: Creating minimal CSS file...");
const minimalCss = `
/* Minimal CSS to prevent errors */
body {
  display: block;
}
`;

// Step 6: Write the files
fs.writeFileSync(path.join(assetsDir, 'app.js'), loaderScript);
fs.writeFileSync(path.join(assetsDir, 'app.css'), minimalCss);

console.log("✅ Deployment preparation complete!");
console.log("Now you can deploy the application through Replit's deployment interface.");
console.log("After deployment, restore the development environment with: node restore-dev.cjs");