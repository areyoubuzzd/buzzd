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

- /backgrounds/[alcoholCategory]/[alcoholSubCategory].jpg
  - Example: /backgrounds/beer/craft_beer.jpg
  - Make sure to have /backgrounds/[alcoholCategory]/default.jpg images as fallbacks
  
- /brands/[alcoholCategory]/[brandName].png
  - Example: /brands/beer/heineken.png
  - Make sure to have /brands/[alcoholCategory]/default.png images as fallbacks
  
- /restaurants/logos/[restaurantId].png
  - Example: /restaurants/logos/r123.png
  - With a /restaurants/logos/default.png fallback
