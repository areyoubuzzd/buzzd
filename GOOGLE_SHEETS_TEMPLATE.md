# Google Sheets Template for Database Import

This guide provides templates for structuring your Google Sheets to be compatible with the database import functionality.

## Establishments Sheet

Create a sheet named "Establishments" with the following headers:

| name | description | address | city | postalCode | latitude | longitude | imageUrl | rating | type |
|------|-------------|---------|------|------------|----------|-----------|----------|--------|------|
| Establishment Name | Brief description of the establishment | Full address | City name | Postal code | Decimal latitude (e.g. 1.2953) | Decimal longitude (e.g. 103.8506) | URL to image (optional) | Rating from 0-5 (optional) | Type of establishment |

### Example Rows:

| name | description | address | city | postalCode | latitude | longitude | imageUrl | rating | type |
|------|-------------|---------|------|------------|----------|-----------|----------|--------|------|
| The Beer Place | Popular pub with great selection | 123 Main St | Singapore | 123456 | 1.2953 | 103.8506 | https://example.com/beer-place.jpg | 4.5 | pub |
| Whisky Paradise | Premium whisky selection | 456 Oak Ave | Singapore | 234567 | 1.3050 | 103.8321 | https://example.com/whisky-paradise.jpg | 4.8 | bar |

## Deals Sheet

Create a sheet named "Deals" with the following headers:

| establishmentName | title | description | status | type | drinkCategory | drinkSubcategory | isHousePour | brand | servingStyle | servingSize | regularPrice | dealPrice | isOneForOne | startTime | endTime | daysOfWeek | imageUrl |
|-------------------|-------|-------------|--------|------|--------------|------------------|-------------|-------|-------------|-------------|-------------|-----------|------------|-----------|---------|------------|----------|
| Must match an establishment name | Deal title | Description of the deal | active, upcoming, or inactive | drink, food, or both | beer, wine, cocktail, spirits, or non_alcoholic | Subcategory (see below) | true or false | Brand name (optional) | glass, bottle, pint, flight, or bucket | Size description | Regular price (number) | Deal price (number) | true or false | Start time (ISO date) | End time (ISO date) | Days (0-6, comma separated) | Image URL (optional) |

### Valid Subcategories:

- For beer: lager, ale, stout, ipa, craft
- For wine: red_wine, white_wine, rose_wine, sparkling_wine
- For spirits: whisky, gin, vodka, rum, tequila, brandy
- For cocktail: classic, signature, mocktail

### Example Rows:

| establishmentName | title | description | status | type | drinkCategory | drinkSubcategory | isHousePour | brand | servingStyle | servingSize | regularPrice | dealPrice | isOneForOne | startTime | endTime | daysOfWeek | imageUrl |
|-------------------|-------|-------------|--------|------|--------------|------------------|-------------|-------|-------------|-------------|-------------|-----------|------------|-----------|---------|------------|----------|
| The Beer Place | Craft Beer Special | Enjoy our selection of craft beers | active | drink | beer | craft | false | Local Brewery | pint | 1 pint | 12 | 8 | false | 2025-04-01T16:00:00Z | 2025-04-01T19:00:00Z | 1,2,3,4,5 | https://example.com/craft-beer.jpg |
| Whisky Paradise | Premium Whisky Tasting | Sample our finest whisky collection | active | drink | spirits | whisky | false | Macallan | glass | 30ml | 25 | 15 | false | 2025-04-01T18:00:00Z | 2025-04-01T22:00:00Z | 5,6 | https://example.com/whisky-tasting.jpg |
| The Beer Place | Beer & Burger Combo | Craft beer with gourmet burger | active | both | beer | craft | false | Brewdog | pint | 1 pint + burger | 28 | 20 | false | 2025-04-01T12:00:00Z | 2025-04-01T15:00:00Z | 0,6 | https://example.com/beer-burger.jpg |

## Notes for Importing Data

1. The `establishmentName` in the Deals sheet must exactly match the `name` in the Establishments sheet.
2. For dates and times:
   - Use ISO format (YYYY-MM-DDThh:mm:ssZ)
   - For deals that run all day, you can use 00:00:00 for start time and 23:59:59 for end time
3. Days of the week are represented as numbers:
   - 0 = Sunday
   - 1 = Monday
   - 2 = Tuesday
   - 3 = Wednesday
   - 4 = Thursday
   - 5 = Friday
   - 6 = Saturday
4. Use a comma-separated list for multiple days, e.g., "1,2,3" for Monday, Tuesday, Wednesday
5. For Boolean fields (isHousePour, isOneForOne), use the text values "true" or "false"