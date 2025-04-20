#!/bin/bash
# Deployment script for Replit
# Usage: bash scripts/deploy.sh

# Set error handling
set -e

# Display colored output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting deployment process...${NC}"

# 1. Clean and prepare
echo -e "${YELLOW}Step 1: Cleaning build artifacts...${NC}"
rm -rf dist
mkdir -p dist

# 2. Ensure we're in production mode
export NODE_ENV=production

# 3. Run the build with all optimizations
echo -e "${YELLOW}Step 2: Building application for production...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed! See errors above.${NC}"
  exit 1
fi

# 4. Verify build output exists
echo -e "${YELLOW}Step 3: Verifying build output...${NC}"
if [ ! -d "dist/public" ]; then
  echo -e "${RED}Error: dist/public directory not found!${NC}"
  exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
  echo -e "${RED}Error: dist/public/index.html not found!${NC}"
  exit 1
fi

if [ ! -d "dist/public/assets" ]; then
  echo -e "${RED}Error: dist/public/assets directory not found!${NC}"
  exit 1
fi

# Count assets
ASSET_COUNT=$(find dist/public/assets -type f | wc -l)
echo -e "${GREEN}Found ${ASSET_COUNT} asset files in the build output.${NC}"

# 5. Display build success message
echo -e "${GREEN}Build completed successfully! Your app is ready to deploy.${NC}"
echo -e "${BLUE}To deploy, use the Replit deployment interface or run: 'node scripts/prepare-deploy.js' first.${NC}"