# Google Sheets Template for Happy Hour Deals Database

This document provides a template for structuring your Google Sheets to populate the database for the Happy Hour Deals application.

## Required Sheets

Your Google Sheets document should have at least two sheets:

1. **Establishments** - For storing venue information
2. **Deals** - For storing happy hour deals information

## Establishments Sheet Columns

| Column Name | Description | Example |
|-------------|-------------|---------|
| name | Name of the establishment | The Tipsy Tavern |
| description | Brief description | Cozy neighborhood bar with craft beers |
| address | Street address | 123 Main Street |
| city | City | Singapore |
| postalCode | Postal code | 123456 |
| latitude | Latitude coordinate | 1.3521 |
| longitude | Longitude coordinate | 103.8198 |
| imageUrl | URL to the establishment image (optional) | https://example.com/image.jpg |
| rating | Rating value (optional) | 4.5 |
| type | Type of establishment | bar, restaurant, cafe, etc. |

## Deals Sheet Columns

| Column Name | Description | Example |
|-------------|-------------|---------|
| title | Deal title | House Pour Red Wine |
| description | Deal description | Enjoy our house pour red wine at special prices during happy hour! |
| establishmentName | Must match exactly with an establishment name in the Establishments sheet | The Tipsy Tavern |
| status | Status of the deal | active, upcoming, inactive |
| type | Type of deal | drink, food, both |
| regularPrice | Regular price | 15.00 |
| dealPrice | Deal price | 8.00 |
| isOneForOne | Whether it's a 1-for-1 deal (true/false) | FALSE |
| startTime | Start time (ISO format) | 2025-04-01T17:00:00 |
| endTime | End time (ISO format) | 2025-04-01T20:00:00 |
| daysOfWeek | Comma-separated days (0-6, where 0 is Sunday) | 1,2,3,4,5 |
| imageUrl | URL to the deal image (optional) | https://example.com/wine.jpg |
| drinkCategory | Category of drink | beer, wine, cocktail, spirits, non_alcoholic |
| drinkSubcategory | Subcategory of drink | red_wine, white_wine, lager, gin, etc. |
| isHousePour | Whether it's a house pour (true/false) | TRUE |
| brand | Brand name (optional) | Tiger, Heineken, Monkey Shoulder |
| servingStyle | How it's served | glass, bottle, pint, flight, bucket |
| servingSize | Size of serving | 150ml, 500ml, 5 x 330ml |

## Valid Values for Categorical Fields

### Deal Status
- `active`: Currently active deals
- `upcoming`: Deals that will start in the future
- `inactive`: Expired or paused deals

### Deal Type
- `drink`: Deals on drinks only
- `food`: Deals on food only
- `both`: Deals that include both food and drinks

### Drink Categories
- `beer`
- `wine`
- `cocktail`
- `spirits`
- `non_alcoholic`

### Drink Subcategories

Wine:
- `red_wine`
- `white_wine`
- `rose_wine`
- `sparkling_wine`

Beer:
- `lager`
- `ale`
- `stout`
- `ipa`
- `craft`

Spirits:
- `whisky`
- `gin`
- `vodka`
- `rum`
- `tequila`
- `brandy`

Cocktails:
- `classic`
- `signature`
- `mocktail`

### Serving Styles
- `glass`: Single glass serving
- `bottle`: Full bottle
- `pint`: Beer pint
- `flight`: Tasting flight of multiple small servings
- `bucket`: Bucket of multiple bottles

## Example Entries

### Establishments Sheet Example

| name | description | address | city | postalCode | latitude | longitude | imageUrl | rating | type |
|------|-------------|---------|------|------------|----------|-----------|----------|--------|------|
| The Tipsy Tavern | Cozy neighborhood bar with craft beers | 123 Main Street | Singapore | 123456 | 1.3521 | 103.8198 | https://example.com/tavern.jpg | 4.5 | bar |
| Vineyard Bistro | Upscale wine bar with extensive selection | 456 Wine Avenue | Singapore | 234567 | 1.3423 | 103.8048 | https://example.com/vineyard.jpg | 4.7 | bar |

### Deals Sheet Example

| title | description | establishmentName | status | type | regularPrice | dealPrice | isOneForOne | startTime | endTime | daysOfWeek | imageUrl | drinkCategory | drinkSubcategory | isHousePour | brand | servingStyle | servingSize |
|-------|-------------|-------------------|--------|------|--------------|-----------|-------------|-----------|---------|------------|---------|---------------|-----------------|------------|-------|--------------|------------|
| House Pour Red Wine | Enjoy our house pour red wine at special prices during happy hour! | The Tipsy Tavern | active | drink | 15.00 | 8.00 | FALSE | 2025-04-01T17:00:00 | 2025-04-01T20:00:00 | 1,2,3,4,5 | | wine | red_wine | TRUE | | glass | 150ml |
| Tiger Beer Bucket | 5 bottles of Tiger beer in a bucket of ice | Vineyard Bistro | active | drink | 50.00 | 35.00 | FALSE | 2025-04-01T18:00:00 | 2025-04-01T23:00:00 | 4,5,6 | | beer | lager | FALSE | Tiger | bucket | 5 x 330ml |
| Classic Cocktails 1-for-1 | Buy one classic cocktail, get one free! | The Tipsy Tavern | active | drink | 22.00 | 22.00 | TRUE | 2025-04-01T19:00:00 | 2025-04-01T22:00:00 | 3,4 | | cocktail | classic | FALSE | | glass | 150ml |

## Tips for Data Entry

1. **Establishment Names**: Must match exactly between the Establishments and Deals sheets.
2. **Boolean Values**: Use either `TRUE`/`FALSE` or `true`/`false`.
3. **Date/Time Values**: Use ISO format (YYYY-MM-DDThh:mm:ss).
4. **Days of Week**: Use comma-separated values without spaces (e.g., `1,2,3,4,5`).
5. **House Pour**: Most happy hour deals are on "house pour" drinks (establishment's standard, non-premium options).
6. **Brand Names**: Only specify for branded bottles or special branded deals.
7. **Numerical Values**: Don't include currency symbols in prices, just the number.

## Importing the Data

After setting up your Google Sheets according to this template, run the import script:

```bash
npx tsx server/scripts/importData.ts
```

The script will:
1. Connect to your Google Sheets document
2. Clear the current database content
3. Import establishments first
4. Import deals, linking them to the appropriate establishments