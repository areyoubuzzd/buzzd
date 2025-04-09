#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=========================================================${NC}"
echo -e "${YELLOW}    Google Sheets to PostgreSQL Database Sync Utility    ${NC}"
echo -e "${YELLOW}=========================================================${NC}"
echo ""

if [ "$1" == "all" ]; then
  echo -e "${YELLOW}Syncing all data (establishments & deals) from Google Sheets to database...${NC}"
  npx tsx server/scripts/sync-database.ts
elif [ "$1" == "establishments" ]; then
  echo -e "${YELLOW}Syncing only establishments from Google Sheets to database...${NC}"
  npx tsx -e "import { syncEstablishmentsFromSheets } from './server/services/googleSheetsService'; syncEstablishmentsFromSheets().then(result => { console.log('Synced ' + result.length + ' establishments successfully'); process.exit(0); }).catch(err => { console.error('Error:', err); process.exit(1); })"
elif [ "$1" == "deals" ]; then
  echo -e "${YELLOW}Syncing only deals from Google Sheets to database...${NC}"
  npx tsx -e "import { syncDealsFromSheets } from './server/services/googleSheetsService'; syncDealsFromSheets().then(result => { console.log('Synced ' + result.length + ' deals successfully'); process.exit(0); }).catch(err => { console.error('Error:', err); process.exit(1); })"
else
  echo -e "${YELLOW}Usage:${NC}"
  echo -e "  ${GREEN}./db-sync.sh all${NC} - Sync both establishments and deals"
  echo -e "  ${GREEN}./db-sync.sh establishments${NC} - Sync only establishments"
  echo -e "  ${GREEN}./db-sync.sh deals${NC} - Sync only deals"
  exit 1
fi

# Check if the script executed successfully
if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}Database sync completed successfully!${NC}"
else
  echo ""
  echo -e "${RED}Database sync failed. Please check the error messages above.${NC}"
  exit 1
fi