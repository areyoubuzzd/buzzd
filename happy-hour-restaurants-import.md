# Happy Hour Restaurants Import Guide

## Overview

This script allows you to import a curated list of restaurants that have happy hour deals directly into your database. The script:

1. Takes a list of restaurant names and their areas from a CSV file
2. Looks up detailed information about each restaurant using Google Places API
3. Imports the complete restaurant data into your database

This approach ensures that:
- Only restaurants with happy hour deals get imported
- You get accurate location data (coordinates, address, etc.)
- You can handle restaurants with multiple branches by specifying the area

## Usage Instructions

### Step 1: Create a CSV file with your restaurant data

First, create a sample file to get started:

```bash
node server/scripts/import-curated-restaurants.js --create-sample
```

This will create a file called `happy-hour-restaurants.csv` in the root directory with sample content.

### Step 2: Edit the CSV file

Open the CSV file and edit it to include all restaurants with happy hour deals in Singapore. The format is:

```
restaurant_name,area
"Harry's Bar,Holland Village"
"Wala Wala Cafe Bar,Holland Village"
"Brewerkz,Clarke Quay"
...
```

Notes:
- Use quotes around restaurant names that contain commas
- Be as specific as possible with the area to help find the right branch
- Common areas in Singapore: Orchard Road, Clarke Quay, Holland Village, Boat Quay, Tanjong Pagar, etc.

### Step 3: Run the import script

Once your CSV file is ready, run:

```bash
node server/scripts/import-curated-restaurants.js
```

The script will:
1. Read your CSV file
2. Look up each restaurant using Google Places API
3. Import the data into your database

### Step 4: Add happy hour deals

Now that your restaurants are in the database, you can add happy hour deals for them. Use the establishment IDs from the database when creating deals.

## Troubleshooting

- If restaurants can't be found, try making the area more specific (e.g., "Clarke Quay" instead of just "Singapore")
- If you're getting the wrong branch, include more details in the area (e.g., "Orchard ION" instead of just "Orchard")
- Make sure your Google Maps API key is properly set in your environment variables

## Requirements

- Node.js
- Access to Google Places API (GOOGLE_MAPS_API_KEY environment variable must be set)
- Connection to your PostgreSQL database (DATABASE_URL environment variable must be set)