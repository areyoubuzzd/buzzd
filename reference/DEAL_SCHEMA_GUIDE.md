# Happy Hour Deals Database Schema Guide

This guide explains how to use the updated database schema for the Happy Hour Deals application. The schema has been designed to properly categorize and display drink deals based on real-world happy hour offerings.

## Core Concepts

### House Pour vs. Branded

- **House Pour**: Most happy hour deals are on "house pour" drinks, which are the establishment's standard, non-premium options. These are typically not branded specifically.
  - Example: "House Pour Red Wine", "House Pour Gin", "House Draft Beer"
  
- **Branded**: Some deals are for specific brands, especially for bottles rather than glasses.
  - Example: "Monkey Shoulder Bottle", "Tiger Beer Bucket"

### Main Categories

1. **Wine**
   - Simplified to just: "Red Wine", "White Wine", or "Wine" (for both)
   - No specific wine types like Cabernet or Chardonnay in happy hour deals
   - Always described as "House Pour" for glass deals

2. **Beer**
   - Can be draft/tap (house pour) or bottled (often branded)
   - Serving styles: pint, bottle, bucket (multiple bottles), flight (tasting)

3. **Spirits**
   - Typically categorized as: Whisky, Gin, Vodka, Rum, Tequila, Brandy
   - Most happy hour deals are on "house pour spirits"
   - Premium brands are more common in bottle deals

4. **Cocktails**
   - Usually "House Cocktails" or specific classics
   - Often offered as 1-for-1 deals

## Key Fields in the Schema

- `drinkCategory`: Main category (beer, wine, cocktail, spirits, non_alcoholic)
- `drinkSubcategory`: Specific type within category (e.g., red_wine, whisky, lager)
- `isHousePour`: Boolean flag for house pour designation
- `brand`: Optional field for branded drinks
- `servingStyle`: How it's served (glass, bottle, pint, flight, bucket)
- `servingSize`: The volume or quantity (e.g., "150ml", "5 x 330ml")
- `isOneForOne`: Boolean flag for 1-for-1 deals

## Display Guidelines

### Wine Cards
- For red wine: red/burgundy gradient (but only 50% of the time)
- For white wine: golden/cream gradient
- For generic wine: standard burgundy gradient
- Display as "House Pour Red Wine", "House Pour White Wine", or "House Pour Wine"
- Always show with wine glass hero image

### Beer Cards
- Variety of colors (orange, lighter orange, teal) to avoid repetitive appearance
- Specify serving style in the title (e.g., "Draft", "Pint", "Bucket")
- Show appropriate hero image based on serving style (pint glass vs. bottle)

### Spirit Cards
- Specify the type in the title for specific spirits (e.g., "House Pour Whisky")
- Use purple/violet gradients for consistency
- For bottle deals, show the brand name prominently

### Cocktail Cards
- Use green/emerald gradients
- Clearly indicate if it's a 1-for-1 deal

## Example Usage

See `reference/example-deals.ts` for concrete examples of how to structure various types of deals.

## Inserting New Deals

1. Fill in all the necessary fields according to this guide
2. Use the appropriate categorization for different drink types
3. Calculate the savings percentage based on regular and deal prices
4. See `reference/insert-deals.ts` for an example script that inserts deals

Remember: The goal is to make deals easily discoverable and understandable for users, so proper categorization is essential!