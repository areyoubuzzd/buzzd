/**
 * Create Static Asset Files for Deployment
 * 
 * This script creates static app.js and app.css files that will
 * ensure the deployed app doesn't fail due to hash mismatches.
 */

import fs from 'fs';
import path from 'path';

console.log("📦 Creating static assets for deployment...");

// Create directory structure if it doesn't exist
const assetsDir = path.join('client', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a smart loader that works in both development and production modes
const redirectJs = `
// This is a static loader file that will find and load the correct entry point
// It handles both development and production environments

(function() {
  console.log("Buzzd App Loader: Initializing...");
  
  // Check if we're in development mode (Vite server is running)
  function isDevMode() {
    return window.location.port === "5173" || // Standard Vite dev port
           window.location.hostname.includes("localhost") || 
           document.querySelector('script[type="module"][src*="@vite/client"]');
  }
  
  // In development mode, we'll let Vite handle everything 
  if (isDevMode()) {
    console.log("Buzzd App Loader: Development mode detected, letting Vite handle the loading");
    // In development, we don't need to do anything special
    // The Vite dev server will handle loading the app
    return;
  }

  // In production mode, we need to find the hashed files
  console.log("Buzzd App Loader: Production mode detected, looking for entry point");
  
  // First check if the app is already running
  setTimeout(function() {
    if (document.getElementById('root').children.length > 0) {
      console.log("Buzzd App Loader: App appears to be already loaded");
      return;
    }
    
    console.log("Buzzd App Loader: Looking for entry files...");
    
    // Method 1: Look for existing script tags with hashed names
    const scripts = document.querySelectorAll('script[src^="/assets/index-"]');
    if (scripts.length > 0) {
      console.log("Buzzd App Loader: Found script:", scripts[0].src);
      return; // Script is already loading correctly
    }
    
    // Method 2: Look for CSS links to find the pattern of the hashed filename
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
    
    // Method 3: If we're here, we couldn't find any entry points, so try the client directly
    console.log("Buzzd App Loader: No entry points found, trying fallbacks...");
    
    // Try to load from the build directory (where Vite outputs files)
    const fallbackSrc = '/build/client.js';
    console.log("Buzzd App Loader: Trying fallback:", fallbackSrc);
    
    const fallbackScript = document.createElement('script');
    fallbackScript.type = 'module';
    fallbackScript.src = fallbackSrc;
    document.head.appendChild(fallbackScript);
    
  }, 500);
})();
`;

// Create a minimal CSS file
const minimalCss = `
/* Minimal CSS to prevent errors */
body {
  display: block;
}
`;

// Write the files
fs.writeFileSync(path.join(assetsDir, 'app.js'), redirectJs);
fs.writeFileSync(path.join(assetsDir, 'app.css'), minimalCss);

console.log("✅ Created static asset files:");
console.log(" - client/assets/app.js");
console.log(" - client/assets/app.css");
console.log("\nThese files will ensure that the app can load any hashed assets in deployment.");