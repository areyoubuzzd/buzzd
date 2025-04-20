# Buzzd - Happy Hour Deals Finder

A location-based happy hour deals discovery platform that connects users with real-time restaurant discounts through an intuitive mobile interface.

## Google Sheets Setup

For the MVP, this app uses Google Sheets as a database. Here is how to set it up:

### 1. Create your Google Sheets document

Create a Google Sheets document with the following sheets and columns:

#### Restaurants Sheet
- restaurantId (unique identifier)
- name (restaurant name)
- address (full address)
- postalCode 
- phoneNumber
- cuisine (type of cuisine)
- area (neighborhood or district)
- priority (numerical value for prioritizing listings)
- latitude (for location-based queries)
- longitude (for location-based queries)
- website (restaurant website URL)
- openingHours (in JSON format or separate columns for each day)
- logoUrl (URL to restaurant logo on Cloudinary)

#### Deals Sheet
- dealId (unique identifier)
- restaurantId (foreign key to link with Restaurants sheet)
- title (deal name/title)
- description (detailed description of the deal)
- startTime (time when deal starts - HH:MM format)
- endTime (time when deal ends - HH:MM format)
- startDate (if the deal has a specific start date)
- endDate (if the deal has an expiration date)
- daysActive (comma-separated list of days: Mon,Tue,Wed,Thu,Fri,Sat,Sun)
- dealStatus (active, upcoming, inactive)
- dealType (drink, food, both)
- alcoholCategory (beer, wine, cocktails, whisky, bubbly, etc.)
- alcoholSubCategory (light_beer, red_wine, etc.)
- brandName (specific brand like "Heineken")
- servingStyle (bottle, glass, default) - indicates whether this is a deal on bottle or by the glass
- originalPrice (original price before discount)
- discountedPrice (price after discount)
- discountPercentage (calculated discount percentage)
- isFeatured (boolean: TRUE/FALSE)
- isPremium (boolean: TRUE/FALSE - whether it is a premium deal)
- isOneForOne (boolean: TRUE/FALSE)
- tags (comma-separated list of tags like "Happy Hour,Weekend Special")
- customBgImageUrl (optional override for background image)
- customBrandImageUrl (optional override for brand image)

### 2. Set up Google Cloud API access

1. Go to the Google Cloud Console
2. Create a new project
3. Enable the Google Sheets API
4. Create a Service Account
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Fill in the details and grant the role "Project" > "Editor"
   - Create a JSON key and download it
5. Share your Google Sheet with the service account email (it should look like something@project-id.iam.gserviceaccount.com)

### 3. Set up environment variables

Create a .env file in the root directory based on the .env.example file with your credentials.

## Cloudinary Setup

For image storage and delivery, this app uses Cloudinary:

1. Sign up for a free account at Cloudinary
2. Get your cloud name, API key, and API secret from the dashboard
3. Add these to your .env file

### Image Organization in Cloudinary

For optimal performance, organize your images in Cloudinary following this structure:

#### Background Images
```
/backgrounds/[alcoholCategory]/image
```

Examples:
- `/backgrounds/beer/image`
- `/backgrounds/wine/image`
- `/backgrounds/whisky/image`
- `/backgrounds/cocktail/image`

Default fallback:
- `/backgrounds/default/image`

#### Brand Images (with bottle/glass distinction)
```
/brands/[alcoholCategory]/[brandName]/[bottle_or_glass]
```

Examples for beer, wine, whisky (bottle and glass):
- `/brands/beer/heineken/bottle`
- `/brands/beer/heineken/glass`
- `/brands/wine/yellowtail/bottle`
- `/brands/wine/yellowtail/glass`

Examples for cocktails (glass only):
- `/brands/cocktail/margarita/glass`
- `/brands/cocktail/mojito/glass`
- `/brands/cocktail/old_fashioned/glass`

Default fallbacks by category and serving style:
- `/brands/beer/bottle/default`
- `/brands/beer/glass/default`
- `/brands/wine/bottle/default`
- `/brands/wine/glass/default`
- `/brands/cocktail/glass/default`

#### Restaurant Logos
```
/restaurants/logos/[restaurantId]
```

Example:
- `/restaurants/logos/SG0109` (for Chimichanga restaurant)

Default fallback:
- `/restaurants/logos/default`

## Test Endpoints

You can verify your setup is working by accessing these test endpoints:

1. `/api/test-cloudinary` - Shows sample image URLs for different categories and serving styles
2. `/api/test-restaurants` - Lists all restaurants from your Google Sheet
3. `/api/test-google-sheets` - Shows metadata about your Google Sheets document

## Testing the App

1. Start the server with workflow "Start application"
2. Access the app at `http://localhost:5000`
3. For the deals endpoint, try: `/api/sheets/deals/nearby?lat=1.3521&lng=103.8198&radius=5`

## Deployment

This application includes a special deployment process to avoid asset filename issues on Replit:

1. Before deploying, run: `node pre-deploy.js`
2. Use Replit's deployment interface to deploy the app
3. For detailed instructions, see `DEPLOYMENT_GUIDE.md`

### Why the special deployment process?

Vite generates hashed filenames for assets (JS/CSS) which can cause issues with Replit's deployment process. Our deployment scripts create stable filenames that don't change between environments, ensuring consistent references.

### Available Deployment Scripts

- `pre-deploy.js` - Recommended all-in-one solution (clean, build, fix, verify)
- `bust-cache.js` - Fixes hash mismatches in an existing build
- `deployment-check.js` - Verifies deployment readiness
- `simple-fix.js` - Legacy script with basic functionality
