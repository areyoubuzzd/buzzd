#!/bin/bash

# Set environment for production deployment
echo "🔧 Setting production environment..."
export NODE_ENV=production
export DISABLE_CLOUDINARY=true
export DISABLE_CLOUDFLARE=true

# Build the frontend with Vite
echo "📦 Building frontend..."
npm run build

# Start the server using tsx for TypeScript support
echo "🚀 Starting server..."
exec npx tsx server-single.js