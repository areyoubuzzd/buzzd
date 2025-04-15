#!/bin/bash

echo "Exporting bars from database to Google Sheets..."
npx tsx server/scripts/export-bars-to-sheets-direct.ts

echo "Export complete."