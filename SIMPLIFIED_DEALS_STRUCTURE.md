# Simplified Happy Hour Deals Structure

This document outlines the simplified structure for importing happy hour deals from Google Sheets.

## Google Sheet Structure

Your Google Sheet should contain the following columns:

| Column Name | Data Type | Description | Example | Required |
|-------------|-----------|-------------|---------|----------|
| `establishment_id` | number | ID of the establishment | `1` | ✅ |
| `alcohol_category` | string | Category of alcohol | `"Beer"`, `"Wine"`, `"Spirits"` | ✅ |
| `alcohol_subcategory` | string | Subcategory of alcohol | `"Red wine"`, `"Whisky"` | ❌ |
| `alcohol_subcategory2` | string | Additional subcategory | `"Single Malt"` | ❌ |
| `drink_name` | string | Name of the drink | `"Heineken"`, `"House Red"` | ✅ |
| `standard_price` | number | Regular price | `15.90` | ✅ |
| `happy_hour_price` | number | Happy hour price | `9.90` | ✅ |
| `valid_days` | string | Days the deal is valid | `"Mon, Tue, Wed"` or `"Weekdays"` | ✅ |
| `hh_start_time` | string | Happy hour start time (24h format) | `"17:00"` | ✅ |
| `hh_end_time` | string | Happy hour end time (24h format) | `"19:00"` | ✅ |
| `imageUrl` | string | URL to an image for the deal | `"https://example.com/beer.jpg"` | ❌ |

## Notes:

1. **The `establishment_id` column** refers to the ID of the establishment in our database. Make sure you have the establishments already in the database.

2. **Savings fields are calculated automatically**:
   - `savings` = standard_price - happy_hour_price
   - `savings_percentage` = (standard_price - happy_hour_price) / standard_price * 100

3. **Dates and Times**:
   - Use 24-hour format for the time fields (e.g., "17:30", not "5:30 PM")
   - Valid days can be written in various formats:
     - Days of the week: "Mon, Tue, Wed"
     - Periods: "Weekdays", "Weekends", "Daily" 
     - Ranges: "Mon-Thu"

## Import Process

To import deals from your Google Sheet:

1. Make sure your sheet has the correct structure as outlined above
2. Make sure your sheet has the correct sharing permissions (shared with the service account email)
3. Run the import script: `./import-deals.sh`

The script will:
1. Update your database schema if needed
2. Connect to Google Sheets and test the connection
3. Ask for confirmation before importing the data
4. Import the deals into your database

## API Endpoints

The following API endpoints are available for syncing data:

- `POST /api/db/sync/all` - Sync both establishments and deals
- `POST /api/db/sync/establishments` - Sync only establishments
- `POST /api/db/sync/deals` - Sync only deals

These endpoints require admin authentication.

## Example Sheet Row

Here's an example of what a properly formatted row in your Google Sheet might look like:

| establishment_id | alcohol_category | alcohol_subcategory | alcohol_subcategory2 | drink_name | standard_price | happy_hour_price | valid_days | hh_start_time | hh_end_time | imageUrl |
|------------------|------------------|---------------------|----------------------|------------|----------------|------------------|------------|--------------|------------|----------|
| 1 | Beer | Lager | Import | Heineken | 15.90 | 9.90 | Mon-Fri | 17:00 | 19:00 | https://example.com/heineken.jpg |
| 2 | Wine | Red wine |  | House Red | 18.00 | 12.00 | Weekdays | 17:30 | 20:00 |  |
| 1 | Spirits | Whisky | Single Malt | Macallan 12 | 28.00 | 20.00 | Mon, Wed, Fri | 18:00 | 21:00 |  |