#!/bin/bash

# Build the frontend with Vite
echo "📦 Building frontend..."
npm run build

# Start the server using tsx for TypeScript support
echo "🚀 Starting server..."
exec npx tsx server-single.js