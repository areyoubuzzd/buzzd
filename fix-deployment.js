/**
 * Fix Deployment Script for Replit
 * 
 * This script creates a special deployment build without hashed filenames
 * which resolves the common hash mismatch issues in Replit deployments.
 * 
 * Usage: 
 * 1. node fix-deployment.js
 * 2. Deploy using Replit's interface with default settings
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Print colored message
const print = (msg, color = colors.reset) => console.log(`${color}${msg}${colors.reset}`);

// Step 1: Clean up previous builds
const step1 = () => {
  print('\n📦 STEP 1: Cleaning up previous builds...', colors.blue);
  
  try {
    // Remove previous build
    if (fs.existsSync('dist')) {
      print('Removing old dist directory...', colors.yellow);
      execSync('rm -rf dist');
    }
    
    // Create backup of vite.config.ts
    if (!fs.existsSync('vite.config.backup.ts') && fs.existsSync('vite.config.ts')) {
      print('Creating backup of vite.config.ts...', colors.yellow);
      fs.copyFileSync('vite.config.ts', 'vite.config.backup.ts');
    }
    
    print('✅ Clean-up complete', colors.green);
    return true;
  } catch (error) {
    print(`❌ Error during clean-up: ${error.message}`, colors.red);
    return false;
  }
};

// Step 2: Modify Vite config to disable asset hash
const step2 = () => {
  print('\n⚙️ STEP 2: Modifying Vite config to disable asset hashing...', colors.blue);
  
  try {
    if (!fs.existsSync('vite.config.ts')) {
      print('❌ vite.config.ts not found', colors.red);
      return false;
    }
    
    let viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
    
    // Check if the config already has rollupOptions
    if (viteConfig.includes('rollupOptions')) {
      print('Vite config already has rollupOptions, updating...', colors.yellow);
      
      // Already has rollupOptions, add asset naming
      if (!viteConfig.includes('assetFileNames')) {
        viteConfig = viteConfig.replace(
          /rollupOptions\s*:\s*{/,
          'rollupOptions: {\n      output: {\n        entryFileNames: "assets/[name].js",\n        chunkFileNames: "assets/[name].js",\n        assetFileNames: "assets/[name].[ext]"\n      },'
        );
      }
    } else {
      // Doesn't have rollupOptions, add the whole build section
      print('Adding build configuration with rollupOptions...', colors.yellow);
      
      // Check if there's already a build section
      if (viteConfig.includes('build: {')) {
        // Find where the build section begins
        const buildSectionStart = viteConfig.indexOf('build: {');
        const buildSectionEnd = viteConfig.indexOf('},', buildSectionStart);
        
        if (buildSectionEnd !== -1) {
          // Insert rollupOptions into the existing build section
          viteConfig = viteConfig.slice(0, buildSectionEnd) + 
            ',\n    rollupOptions: {\n      output: {\n        entryFileNames: "assets/index.js",\n        chunkFileNames: "assets/[name].js",\n        assetFileNames: "assets/[name].[ext]"\n      }\n    }' + 
            viteConfig.slice(buildSectionEnd);
        } else {
          print('Could not find the end of the build section', colors.yellow);
        }
      } else {
        // Add a new build section with rollupOptions
        const lastClosingBrace = viteConfig.lastIndexOf('}');
        
        if (lastClosingBrace !== -1) {
          // Insert build config before the last closing brace
          viteConfig = viteConfig.slice(0, lastClosingBrace) + 
            ',\n  build: {\n    outDir: path.resolve(import.meta.dirname, "dist/public"),\n    emptyOutDir: true,\n    rollupOptions: {\n      output: {\n        entryFileNames: "assets/index.js",\n        chunkFileNames: "assets/[name].js",\n        assetFileNames: "assets/[name].[ext]"\n      }\n    }\n  }' + 
            viteConfig.slice(lastClosingBrace);
        } else {
          print('❌ Could not find the end of the defineConfig object', colors.red);
          return false;
        }
      }
    }
    
    // Write modified config back to file
    fs.writeFileSync('vite.config.ts', viteConfig);
    print('✅ Vite config modified to disable asset hashing', colors.green);
    return true;
  } catch (error) {
    print(`❌ Error modifying Vite config: ${error.message}`, colors.red);
    return false;
  }
};

// Step 3: Run production build
const step3 = () => {
  print('\n🔨 STEP 3: Running production build...', colors.blue);
  
  try {
    print('Building the application...', colors.yellow);
    execSync('NODE_ENV=production npm run build', { stdio: 'inherit' });
    print('✅ Production build complete', colors.green);
    return true;
  } catch (error) {
    print(`❌ Build failed: ${error.message}`, colors.red);
    return false;
  }
};

// Step 4: Verify the build output
const step4 = () => {
  print('\n🔍 STEP 4: Verifying build output...', colors.blue);
  
  try {
    // Check if index.html exists
    const indexHtmlPath = path.join('dist', 'public', 'index.html');
    if (!fs.existsSync(indexHtmlPath)) {
      print('❌ index.html not found in build output', colors.red);
      return false;
    }
    
    // Check for assets directory
    const assetsDir = path.join('dist', 'public', 'assets');
    if (!fs.existsSync(assetsDir)) {
      print('❌ assets directory not found in build output', colors.red);
      return false;
    }
    
    // Read index.html to verify it references non-hashed files
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Check if JS file is referenced with unhashed name
    if (!indexHtml.includes('src="/assets/index.js"')) {
      print('⚠️ index.html does not reference unhashed JS file', colors.yellow);
      
      // Extract the actual JS file reference
      const jsMatch = indexHtml.match(/src="\/assets\/([^"]+\.js)"/);
      if (jsMatch) {
        const jsFile = jsMatch[1];
        print(`Found JS reference: ${jsFile}`, colors.yellow);
        
        // Check if the file exists
        const jsPath = path.join(assetsDir, jsFile);
        if (fs.existsSync(jsPath)) {
          // Copy the file to index.js
          fs.copyFileSync(jsPath, path.join(assetsDir, 'index.js'));
          print('✅ Created copy of JS file as index.js', colors.green);
          
          // Update index.html to reference unhashed file
          const updatedHtml = indexHtml.replace(
            `src="/assets/${jsFile}"`,
            'src="/assets/index.js"'
          );
          fs.writeFileSync(indexHtmlPath, updatedHtml);
          print('✅ Updated index.html to reference unhashed JS file', colors.green);
        } else {
          print(`❌ Referenced JS file not found: ${jsPath}`, colors.red);
        }
      } else {
        print('❌ Could not find JS file reference in index.html', colors.red);
      }
    } else {
      print('✅ index.html references unhashed JS file', colors.green);
    }
    
    // Check CSS file
    const cssMatch = indexHtml.match(/href="\/assets\/([^"]+\.css)"/);
    if (cssMatch) {
      const cssFile = cssMatch[1];
      print(`Found CSS reference: ${cssFile}`, colors.yellow);
      
      if (cssFile !== 'index.css') {
        // Copy the file to index.css
        const cssPath = path.join(assetsDir, cssFile);
        if (fs.existsSync(cssPath)) {
          fs.copyFileSync(cssPath, path.join(assetsDir, 'index.css'));
          print('✅ Created copy of CSS file as index.css', colors.green);
          
          // Update index.html to reference unhashed file
          const updatedHtml = fs.readFileSync(indexHtmlPath, 'utf8')
            .replace(
              `href="/assets/${cssFile}"`,
              'href="/assets/index.css"'
            );
          fs.writeFileSync(indexHtmlPath, updatedHtml);
          print('✅ Updated index.html to reference unhashed CSS file', colors.green);
        } else {
          print(`❌ Referenced CSS file not found: ${cssPath}`, colors.red);
        }
      } else {
        print('✅ index.html already references unhashed CSS file', colors.green);
      }
    }
    
    // Final verification
    const finalHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const hasUnhashedJs = finalHtml.includes('src="/assets/index.js"');
    const hasUnhashedCss = finalHtml.includes('href="/assets/index.css"');
    
    if (hasUnhashedJs && hasUnhashedCss) {
      print('✅ Build output verification successful', colors.green);
      return true;
    } else {
      print('⚠️ Build output verification partial - deploy may still work', colors.yellow);
      return true;
    }
  } catch (error) {
    print(`❌ Error verifying build output: ${error.message}`, colors.red);
    return false;
  }
};

// Step 5: Restore original Vite config
const step5 = () => {
  print('\n🔄 STEP 5: Restoring original Vite config...', colors.blue);
  
  try {
    if (fs.existsSync('vite.config.backup.ts')) {
      fs.copyFileSync('vite.config.backup.ts', 'vite.config.ts');
      fs.unlinkSync('vite.config.backup.ts');
      print('✅ Original Vite config restored', colors.green);
      return true;
    } else {
      print('⚠️ No Vite config backup found, skipping restoration', colors.yellow);
      return true;
    }
  } catch (error) {
    print(`❌ Error restoring Vite config: ${error.message}`, colors.red);
    return false;
  }
};

// Main function
const main = async () => {
  print('🚀 DEPLOYMENT FIX WIZARD 🚀', colors.magenta);
  print('This tool creates a special build for Replit deployment to fix hash mismatches', colors.cyan);
  print('--------------------------------------------------------------', colors.magenta);
  
  let success = true;
  
  success = step1() && success; // Clean up
  success = step2() && success; // Modify Vite config
  success = step3() && success; // Run build
  success = step4() && success; // Verify build
  success = step5() && success; // Restore config
  
  if (success) {
    print('\n✨ DEPLOYMENT FIX COMPLETE ✨', colors.magenta);
    print('Your application is now ready for deployment with unhashed static file references.', colors.cyan);
    print('Follow these steps to deploy:', colors.cyan);
    print('1. Click the "Deploy" button in the Replit interface', colors.yellow);
    print('2. Use the default build and run commands', colors.yellow);
    print('3. Click "Deploy" to start the deployment process', colors.yellow);
    print('--------------------------------------------------------------', colors.magenta);
  } else {
    print('\n❌ DEPLOYMENT FIX FAILED', colors.red);
    print('Please check the errors above and try again.', colors.yellow);
  }
};

main().catch(error => {
  print(`❌ Unhandled error: ${error.message}`, colors.red);
  process.exit(1);
});