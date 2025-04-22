#!/bin/bash

# Print deployment header
echo "===================================================="
echo "           BUZZD APP DEPLOYMENT SCRIPT              "
echo "===================================================="
echo "Started at: $(date)"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "===================================================="

# Set environment for production deployment
echo "🔧 Setting production environment variables..."
export NODE_ENV=production
export DISABLE_CLOUDINARY=true
export DISABLE_CLOUDFLARE=true

# Set the PORT environment variable
# For Replit deployments, we need to use port 3000
if [ -n "$REPL_ID" ] && [ -n "$REPL_SLUG" ]; then
  echo "📡 Detected Replit deployment environment"
  export PORT=3000
  echo "   Using required Replit deployment port: $PORT"
else
  # Default port for local development
  export PORT=${PORT:-3000}
  echo "   Using port: $PORT"
fi

# Print key environment variables
echo "🔍 Environment details:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PORT: $PORT"
echo "  - DISABLE_CLOUDINARY: $DISABLE_CLOUDINARY"
echo "  - DISABLE_CLOUDFLARE: $DISABLE_CLOUDFLARE"
echo "  - Working directory: $(pwd)"

# Clean build directory
echo "🧹 Cleaning previous build..."
rm -rf dist
mkdir -p dist/public

# Build the frontend with Vite
echo "📦 Building frontend..."
npm run build

# Check if build was successful
if [ ! -f "dist/public/index.html" ]; then
  echo "❌ Frontend build failed - index.html not found!"
  
  # Create a minimal fallback index.html in case the build fails
  echo "📝 Creating fallback index.html..."
  mkdir -p dist/public
  cat > dist/public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buzzd - Singapore Happy Hour Deals</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #f59e0b; }
    .logo {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="logo">🍸 Buzzd</div>
  <h1>Singapore's Happy Hour Finder</h1>
  <p>Our app is currently undergoing maintenance.</p>
  <p>Please check back soon for the best happy hour deals in Singapore!</p>
</body>
</html>
EOL
else
  echo "✅ Frontend build completed successfully"
fi

# List key files
echo "📂 Key files in deployment:"
ls -la dist/public | head -n 10

# Start the server using tsx for TypeScript support
echo "🚀 Starting server..."
echo "===================================================="
exec npx tsx server-single.js
