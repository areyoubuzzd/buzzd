#!/bin/bash
# Special Deployment Script for Replit
# Usage: bash deploy.sh

# Display colored output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SPECIAL REPLIT DEPLOYMENT HELPER     ${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Step 1: Making a backup of any previous deploy files...${NC}"
if [ -d "dist" ]; then
  mkdir -p .deploy_backup
  cp -r dist .deploy_backup/
  echo -e "${GREEN}✅ Backup created in .deploy_backup${NC}"
fi

echo -e "${YELLOW}Step 2: Completely removing old dist directory...${NC}"
rm -rf dist
echo -e "${GREEN}✅ Old build files removed${NC}"

echo -e "${YELLOW}Step 3: Building with production settings...${NC}"
NODE_ENV=production npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed! See errors above.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Production build completed${NC}"

echo -e "${YELLOW}Step 4: Verifying build output...${NC}"
if [ ! -d "dist/public" ]; then
  echo -e "${RED}❌ dist/public directory not found!${NC}"
  exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
  echo -e "${RED}❌ dist/public/index.html not found!${NC}"
  exit 1
fi

# Extract JS file reference
JS_REF=$(grep -o 'src="/assets/index-[^"]*\.js"' dist/public/index.html | cut -d'"' -f2 | sed 's/^\/assets\///')
echo -e "${GREEN}✅ JS file reference: ${JS_REF}${NC}"

# Check if the JS file exists
if [ ! -f "dist/public/assets/${JS_REF}" ]; then
  echo -e "${RED}❌ JS file not found: dist/public/assets/${JS_REF}${NC}"
  exit 1
fi

# Get list of assets
ASSET_COUNT=$(find dist/public/assets -type f | wc -l)
echo -e "${GREEN}✅ Found ${ASSET_COUNT} asset files${NC}"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Deployment preparation successful!${NC}"
echo -e "${BLUE}Now use Replit's deployment interface to deploy your app.${NC}"
echo -e "${YELLOW}IMPORTANT: Make sure to deploy immediately after running this script.${NC}"
echo -e "${BLUE}========================================${NC}"