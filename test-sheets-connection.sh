#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=========================================================${NC}"
echo -e "${YELLOW}         Google Sheets Connection Test Utility           ${NC}"
echo -e "${YELLOW}=========================================================${NC}"
echo ""

echo -e "${YELLOW}Testing connection to Google Sheets...${NC}"
echo "This will validate your Google Sheets API credentials and check if the spreadsheet is accessible."

# Create a temporary test script
TMP_FILE=$(mktemp)
cat > $TMP_FILE << 'EOF'
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function testConnection() {
  try {
    // Environment variables for Google Sheets API
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      console.error('Error: Missing required environment variables');
      console.error('Please ensure the following environment variables are set:');
      console.error('- GOOGLE_SHEETS_SPREADSHEET_ID');
      console.error('- GOOGLE_SHEETS_CLIENT_EMAIL');
      console.error('- GOOGLE_SHEETS_PRIVATE_KEY');
      process.exit(1);
    }

    console.log('Credentials found, attempting to connect...');

    // Initialize auth
    const serviceAccountAuth = new JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    // Initialize the spreadsheet
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
    
    // Load document properties and sheets
    await doc.loadInfo();
    
    console.log(`Successfully connected to spreadsheet: "${doc.title}"`);
    console.log('Available sheets:');
    
    // List all sheets
    const sheets = doc.sheetsByIndex;
    for (const sheet of sheets) {
      console.log(`- ${sheet.title} (${sheet.rowCount} rows x ${sheet.columnCount} columns)`);
    }
    
    // Check for required sheets
    const hasEstablishmentsSheet = Boolean(doc.sheetsByTitle['Establishments']);
    const hasDealsSheet = Boolean(doc.sheetsByTitle['Deals']);
    
    if (!hasEstablishmentsSheet) {
      console.warn('Warning: Could not find a sheet named "Establishments"');
    }
    
    if (!hasDealsSheet) {
      console.warn('Warning: Could not find a sheet named "Deals"');
    }
    
    if (hasEstablishmentsSheet && hasDealsSheet) {
      console.log('All required sheets found. Your Google Sheets setup is correct!');
    } else {
      console.warn('Missing required sheets. Please check the GOOGLE_SHEETS_TEMPLATE.md file for the expected sheet names and structure.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to Google Sheets:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
EOF

# Run the test
npx tsx $TMP_FILE

# Cleanup temp file
rm $TMP_FILE

# Check if the script executed successfully
if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}Connection test completed successfully!${NC}"
  echo -e "To populate your database from Google Sheets, run:"
  echo -e "  ${YELLOW}./db-sync.sh all${NC}"
else
  echo ""
  echo -e "${RED}Connection test failed. Please check the error messages above.${NC}"
  echo -e "Make sure you have the following environment variables set correctly:"
  echo -e "  ${YELLOW}GOOGLE_SHEETS_SPREADSHEET_ID${NC}"
  echo -e "  ${YELLOW}GOOGLE_SHEETS_CLIENT_EMAIL${NC}"
  echo -e "  ${YELLOW}GOOGLE_SHEETS_PRIVATE_KEY${NC}"
  exit 1
fi