/**
 * Direct Deployment Fix for Replit
 *
 * This script:
 * 1. Backs up the original index.html
 * 2. Creates a modified version that detects and loads the correct assets
 * 3. Creates a restore script
 */

const fs = require('fs');
const path = require('path');

console.log("🔧 Running Direct Deployment Fix...");

// Step 1: Backup the original index.html
if (fs.existsSync('client/index.html')) {
  fs.copyFileSync('client/index.html', 'client/index.html.dev');
  console.log("✅ Backed up index.html to index.html.dev");
}

// Step 2: Create the deployment index.html
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
    
    <!-- For development mode - will be ignored in production -->
    <script type="module" src="/src/main.tsx"></script>

    <!-- Auto-detect script for production -->
    <script type="text/javascript">
      (function() {
        // Find all CSS link tags with pattern "/assets/index-*.css"
        const links = document.querySelectorAll('link[href^="/assets/index-"]');
        if (links.length > 0) {
          try {
            const href = links[0].getAttribute('href');
            const match = href.match(/\\/assets\\/(index-[^.]+)\\.css/);
            if (match && match[1]) {
              // Extract the hash part
              const hash = match[1].split('-')[1];
              
              // Check if we have a corresponding JS file
              const scriptSrc = \`/assets/\${match[1]}.js\`;
              
              // Check if the script is already loaded
              if (!document.querySelector(\`script[src="\${scriptSrc}"]\`)) {
                // Add the script tag
                const script = document.createElement('script');
                script.type = 'module';
                script.crossOrigin = 'true';
                script.src = scriptSrc;
                document.head.appendChild(script);
                console.log("Buzzd deployment: Loaded production script", scriptSrc);
              }
            }
          } catch (e) {
            console.error("Error in deployment script:", e);
          }
        } else {
          // Either in development mode or the CSS links aren't found yet
          console.log("Buzzd deployment: No production CSS found, using development mode");
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/javascript" src="https://replit.com/public/js/replit-badge-v3.js"></script>
  </body>
</html>`;

fs.writeFileSync('client/index.html', deploymentHtml);
console.log("✅ Created hybrid development/deployment index.html");

// Step 3: Create a restore script
const restoreScript = `/**
 * Direct Restore Script
 * Restores the original index.html file for development
 */
const fs = require('fs');

console.log("🔄 Restoring development environment...");

try {
  if (fs.existsSync('client/index.html.dev')) {
    fs.copyFileSync('client/index.html.dev', 'client/index.html');
    // Keeping the backup for safety
    // fs.unlinkSync('client/index.html.dev');
    console.log("✅ Restored original index.html");
  } else {
    console.log("⚠️ No backup found at client/index.html.dev");
  }
} catch (e) {
  console.error("❌ Error restoring development environment:", e);
}
`;

fs.writeFileSync('direct-restore.cjs', restoreScript);
console.log("✅ Created restore script at direct-restore.cjs");

console.log("\n🚀 DEPLOYMENT INSTRUCTIONS:");
console.log("1. Deploy your app using Replit's deploy button");
console.log("2. After testing the deployed app, run this to restore development:");
console.log("   node direct-restore.cjs");
console.log("\nNOTE: The index.html is now a hybrid that works in BOTH environments!");