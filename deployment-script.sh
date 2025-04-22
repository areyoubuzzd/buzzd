#!/bin/bash

# Set environment for production deployment
echo "🔧 Setting production environment..."
export NODE_ENV=production
export DISABLE_CLOUDINARY=true
export DISABLE_CLOUDFLARE=true

# Set the PORT environment variable to the default Replit deployment port
# If REPL_ID and REPL_SLUG are set, we're in a deployment environment
if [ -n "$REPL_ID" ] && [ -n "$REPL_SLUG" ]; then
  echo "📡 Detected Replit deployment environment"
  # Force port 3000 for Replit deployments
  export PORT=3000
fi

# Print environment information
echo "🔍 Environment details:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PORT: $PORT"
echo "  - PWD: $(pwd)"

# Build the frontend with Vite
echo "📦 Building frontend..."
npm run build

# Start the server using tsx for TypeScript support
echo "🚀 Starting server..."
exec npx tsx server-single.js