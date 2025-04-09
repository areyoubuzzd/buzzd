# Workflow: Uploading Restaurants to the Establishment Database

## Prerequisites
1. Google Maps API key properly set up in your environment variables as `GOOGLE_MAPS_API_KEY`
2. PostgreSQL database properly configured with connection details in environment variables
3. CSV file containing restaurant data in the correct format

## Step 1: Prepare the CSV File
1. Create a CSV file with columns for restaurant name and area
2. Format: Each row should contain a restaurant name and its area (e.g., "Harry's, Holland Village")
3. The name and area combination is used as a unique identifier to handle chains with multiple locations
4. Save the file as `happy-hour-restaurants.csv` in the project root

Example CSV format:
```
name,area
Harry's,Holland Village
Wala Wala Cafe Bar,Holland Village
Chimichanga,Holland Village
```

## Step 2: Verify Database Schema
1. Ensure the establishments table has all necessary columns:
   - `id` (auto-generated numeric ID)
   - `external_id` (custom ID in format "SG0109", "SG0110", etc.)
   - `name` (restaurant name)
   - `cuisine` (type of establishment - bar, restaurant, etc.)
   - `address` (full address with postal code)
   - `latitude` and `longitude` (coordinates)
   - `area` (neighborhood or district)
   - `phone` (contact number)
   - `website` (official website URL)
   - `rating` (Google rating)
   - `price` (price level indicator)
   - `priority` (for custom sorting/featuring)
   - `imageUrl` (for restaurant logo/image)

## Step 3: Run the Import Script
1. Open a terminal in the project root
2. Execute the script:
   ```bash
   node server/scripts/import-curated-restaurants.js
   ```
3. The script will:
   - Read the CSV file
   - Query Google Places API for detailed information about each restaurant
   - Format and validate the data
   - Insert the restaurant into the establishments table

## Step 4: Verify the Import
1. Check if the import was successful by querying the database:
   ```sql
   SELECT COUNT(*) FROM establishments;
   ```
2. Review the imported data:
   ```sql
   SELECT id, external_id, name, cuisine, address, rating, price, priority FROM establishments;
   ```
3. Verify that the Google Places API data (address, coordinates, rating) was properly fetched

## Step 5: Handle Any Errors or Duplicates
1. If a restaurant couldn't be found by Google Places API, you will see error messages in the console
2. Common issues:
   - Restaurant name is too generic or misspelled
   - Area specification is not precise enough
   - Google Places doesn't have the establishment in its database
3. For duplicate entries (if running the script multiple times):
   - Either clear the table before importing: `DELETE FROM establishments;`
   - Or modify the script to skip existing entries (already implemented)

## Step 6: Add Additional Information (Optional)
1. Update restaurant priorities to feature certain establishments:
   ```sql
   UPDATE establishments SET priority = 1 WHERE name = 'Featured Restaurant Name';
   ```
2. Add restaurant logos:
   - Upload logo images to Cloudinary using the upload tool
   - Update the imageUrl column (you can use either the numeric ID or the external ID):
   ```sql
   UPDATE establishments SET imageUrl = 'cloudinary-url' WHERE id = restaurant_id;
   -- OR using external_id
   UPDATE establishments SET imageUrl = 'cloudinary-url' WHERE external_id = 'SG0109';
   ```

## Step 7: Database Maintenance
1. Periodically review the data for outdated information
2. Update restaurant details as needed:
   ```sql
   UPDATE establishments SET website = 'new-website', phone = 'new-phone' WHERE id = restaurant_id;
   -- OR using external_id
   UPDATE establishments SET website = 'new-website', phone = 'new-phone' WHERE external_id = 'SG0109';
   ```
3. Remove establishments that no longer offer happy hour deals:
   ```sql
   DELETE FROM establishments WHERE id = restaurant_id;
   -- OR using external_id
   DELETE FROM establishments WHERE external_id = 'SG0109';
   ```

## Additional Notes
- The script uses both restaurant name and area as identifiers to distinguish between chain locations
- Only establishments with confirmed happy hour deals should be included in the CSV
- The Google Places API provides accurate data including coordinates, address formatting, ratings, etc.
- Images should be managed through Cloudinary for better performance and organization
- The `external_id` field follows the format SG0109, SG0110, etc., starting from SG0109 and incrementing sequentially
- These custom IDs can be useful for customer-facing references, marketing materials, or integration with other systems
- Both the database `id` and `external_id` can be used to identify restaurants in queries and API requests