/**
 * Ultra-Simple Deployment Fix for Replit
 * 
 * This script directly modifies the index.html file to use stable asset references.
 * Run this right before deployment, then deploy immediately.
 */

const fs = require('fs');
const path = require('path');

console.log("🛠️ Running Ultra-Simple Deployment Fix...");

// Step 1: Backup the development index.html
if (fs.existsSync('client/index.html')) {
  fs.copyFileSync('client/index.html', 'client/index.html.bak');
  console.log("✅ Backed up index.html");
}

// Step 2: Create a simple deployment-ready index.html
const deploymentHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <style data-vite-theme="" data-inject-first="">:root {
      --background: 0 0% 100%;
--foreground: 20 14.3% 4.1%;
--muted: 60 4.8% 95.9%;
--muted-foreground: 25 5.3% 44.7%;
--popover: 0 0% 100%;
--popover-foreground: 20 14.3% 4.1%;
--card: 0 0% 100%;
--card-foreground: 20 14.3% 4.1%;
--border: 20 5.9% 90%;
--input: 20 5.9% 90%;
--primary: 32 15% 81%;
--primary-foreground: 32 5% 14%;
--secondary: 60 4.8% 95.9%;
--secondary-foreground: 24 9.8% 10%;
--accent: 60 4.8% 95.9%;
--accent-foreground: 24 9.8% 10%;
--destructive: 0 84.2% 60.2%;
--destructive-foreground: 60 9.1% 97.8%;
--ring: 20 14.3% 4.1%;
--radius: 0.5rem;
  }
  .dark {
      --background: 240 10% 3.9%;
--foreground: 0 0% 98%;
--muted: 240 3.7% 15.9%;
--muted-foreground: 240 5% 64.9%;
--popover: 240 10% 3.9%;
--popover-foreground: 0 0% 98%;
--card: 240 10% 3.9%;
--card-foreground: 0 0% 98%;
--border: 240 3.7% 15.9%;
--input: 240 3.7% 15.9%;
--primary: 32 15% 81%;
--primary-foreground: 32 5% 14%;
--secondary: 240 3.7% 15.9%;
--secondary-foreground: 0 0% 98%;
--accent: 240 3.7% 15.9%;
--accent-foreground: 0 0% 98%;
--destructive: 0 62.8% 30.6%;
--destructive-foreground: 0 0% 98%;
--ring: 240 4.9% 83.9%;
--radius: 0.5rem;
  }</style>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    
    <!-- Simple deployment loader script -->
    <script type="text/javascript">
      window.addEventListener('DOMContentLoaded', function() {
        // Wait for any existing scripts to load
        setTimeout(function() {
          // If the app is already loaded, do nothing
          if (document.getElementById('root').children.length > 0) {
            console.log("App is already loaded");
            return;
          }
          
          // Look for any scripts with a hash pattern
          var scripts = document.querySelectorAll('script[src^="/assets/index-"]');
          if (scripts.length > 0) {
            console.log("Found script:", scripts[0].src);
            return;
          }
          
          // Try to dynamically load the correct script
          var linkElements = document.querySelectorAll('link[href^="/assets/index-"]');
          if (linkElements.length > 0) {
            try {
              var href = linkElements[0].href;
              var match = href.match(/\\/assets\\/(index-[^.]+)\\.css/);
              if (match && match[1]) {
                var basename = match[1];
                var scriptSrc = "/assets/" + basename + ".js";
                var script = document.createElement('script');
                script.type = 'module';
                script.src = scriptSrc;
                document.head.appendChild(script);
                console.log("Dynamically loaded script:", scriptSrc);
              }
            } catch (e) {
              console.error("Error loading script:", e);
            }
          }
        }, 500);
      });
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/javascript" src="https://replit.com/public/js/replit-badge-v3.js"></script>
  </body>
</html>`;

// Step 3: Write the deployment index.html
fs.writeFileSync('client/index.html', deploymentHtml);
console.log("✅ Created deployment-ready index.html");

console.log("🚀 Ready to deploy!");
console.log("   1. Deploy your app using Replit's deploy button");
console.log("   2. After deployment, restore your development environment:");
console.log("      node simple-restore.cjs");

// Create a simple restore script as well
const restoreScript = `
/**
 * Ultra-Simple Restore Script
 */
const fs = require('fs');

console.log("🔄 Restoring development environment...");

if (fs.existsSync('client/index.html.bak')) {
  fs.copyFileSync('client/index.html.bak', 'client/index.html');
  fs.unlinkSync('client/index.html.bak');
  console.log("✅ Restored original index.html");
} else {
  console.log("⚠️ No backup found!");
}
`;

fs.writeFileSync('simple-restore.cjs', restoreScript);
console.log("✅ Created restore script (simple-restore.cjs)");