#!/bin/bash
# Simple deployment script for Buzzd

echo "🚀 Starting deployment process for Buzzd..."

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
echo "✅ Clean-up complete"

# Step 2: Run production build
echo "🔨 Building for production..."
NODE_ENV=production npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Production build complete"

# Step 3: Create stable JS and CSS files
echo "🔧 Creating stable asset files..."

# Check if dist/public directory exists
if [ ! -d "dist/public" ]; then
    echo "❌ dist/public directory not found"
    exit 1
fi

# Find the hashed JS filename
JS_FILE=$(find dist/public/assets -name "index-*.js" | head -n 1)
if [ -z "$JS_FILE" ]; then
    echo "❌ Cannot find JS file"
    exit 1
fi
JS_BASENAME=$(basename "$JS_FILE")

# Find the hashed CSS filename
CSS_FILE=$(find dist/public/assets -name "index-*.css" | head -n 1)
if [ -z "$CSS_FILE" ]; then
    echo "❌ Cannot find CSS file"
    exit 1
fi
CSS_BASENAME=$(basename "$CSS_FILE")

echo "Found JS: $JS_BASENAME"
echo "Found CSS: $CSS_BASENAME"

# Create copies with stable names
cp "$JS_FILE" "dist/public/assets/index-stable.js"
cp "$CSS_FILE" "dist/public/assets/index-stable.css"
echo "✅ Created stable asset files"

# Step 4: Update index.html references
echo "📝 Updating index.html references..."
sed -i "s|src=\"/assets/$JS_BASENAME\"|src=\"/assets/index-stable.js\"|g" dist/public/index.html
sed -i "s|href=\"/assets/$CSS_BASENAME\"|href=\"/assets/index-stable.css\"|g" dist/public/index.html
echo "✅ Updated index.html references"

# Step 5: Verify the changes
echo "🔍 Verifying changes..."
if grep -q "index-stable.js" dist/public/index.html && grep -q "index-stable.css" dist/public/index.html; then
    echo "✅ Verification successful"
else
    echo "❌ Verification failed - index.html doesn't contain stable references"
    exit 1
fi

echo "✨ DEPLOYMENT PREPARATION COMPLETE ✨"
echo "Your application is now ready for deployment."
echo ""
echo "Next steps:"
echo "1. Click the 'Deploy' button in the Replit interface"
echo "2. Use the default deployment settings"
echo "3. Your application should deploy successfully with fixed asset references"