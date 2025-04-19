#!/bin/bash

# Simple script to refresh deal data while preserving existing logic
# Created: April 2025

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Buzzd Deal Data Refresh Tool ===${NC}"
echo "This tool will refresh deal data from Google Sheets while preserving all existing logic."
echo ""

# Check for Google Sheets credentials
if [ -z "$GOOGLE_SHEETS_CLIENT_EMAIL" ] || [ -z "$GOOGLE_SHEETS_PRIVATE_KEY" ]; then
  echo -e "${RED}Error: Missing Google Sheets credentials.${NC}"
  echo "Please ensure GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY are set in your environment."
  exit 1
fi

# Ask which method to use
echo "Choose a refresh method:"
echo "1) List available sheets first"
echo "2) Import deals directly (standard method)"
echo "3) Import deals in batches (for large datasets)"
echo -n "Enter your choice (1-3): "
read -r choice

case $choice in
  1)
    echo -e "\n${GREEN}Listing available sheets...${NC}"
    npx tsx scripts/list-sheets.ts
    
    echo -e "\n${YELLOW}Enter the name of the sheet containing deals:${NC}"
    read -r tab_name
    
    if [ -z "$tab_name" ]; then
      echo -e "${RED}No sheet name provided. Using default import method instead.${NC}"
      echo -e "${GREEN}Importing deals...${NC}"
      npx tsx scripts/import-deals.ts
    else
      echo -e "${GREEN}Importing deals from sheet '$tab_name'...${NC}"
      npx tsx scripts/import-from-gsheets.ts 1mvmQLAe326ABsIfe2m1dZDd8StlrZrBKjujcT4nGpy0 "$tab_name"
    fi
    ;;
    
  2)
    echo -e "\n${GREEN}Importing deals using standard method...${NC}"
    npx tsx scripts/import-deals.ts
    ;;
    
  3)
    echo -e "\n${GREEN}Importing deals in batches (for large datasets)...${NC}"
    npx tsx scripts/import-deals-batch.ts
    ;;
    
  *)
    echo -e "${RED}Invalid choice. Using default import method.${NC}"
    echo -e "${GREEN}Importing deals...${NC}"
    npx tsx scripts/import-deals.ts
    ;;
esac

# Check if import was successful
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ Deals data has been successfully refreshed!${NC}"
  echo "You can now restart the application to see the updated deals."
  
  echo -e "\n${YELLOW}Would you like to restart the application now? (y/n)${NC}"
  read -r restart
  
  if [[ $restart == "y" || $restart == "Y" ]]; then
    echo -e "${GREEN}Restarting application...${NC}"
    # Find a running node process and kill it
    pid=$(ps aux | grep 'node' | grep -v grep | awk '{print $2}' | head -1)
    if [ -n "$pid" ]; then
      kill $pid
      echo "Application will restart automatically."
    else
      echo "No running application found to restart."
    fi
  else
    echo "Remember to restart the application manually to see the updated deals."
  fi
else
  echo -e "\n${RED}❌ Error refreshing deals data. Check the logs above for details.${NC}"
fi