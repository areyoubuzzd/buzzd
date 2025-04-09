// Example deals demonstrating how to use the new schema structure
// These are formatted according to our schema and focus on the happy hour concept
// with proper categorization

import { InsertDeal } from "../shared/schema";

/**
 * Example House Pour Wine Deals
 */
export const houseWineDeals: Partial<InsertDeal>[] = [
  {
    title: "House Pour Red Wine",
    description: "Enjoy our house pour red wine at special prices during happy hour!",
    type: "drink",
    drinkCategory: "wine",
    drinkSubcategory: "red_wine",
    isHousePour: true,
    servingStyle: "glass",
    servingSize: "150ml",
    regularPrice: 15.00,
    dealPrice: 8.00,
    isOneForOne: false,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  },
  {
    title: "House Pour White Wine",
    description: "Enjoy our house pour white wine at special prices during happy hour!",
    type: "drink",
    drinkCategory: "wine",
    drinkSubcategory: "white_wine",
    isHousePour: true,
    servingStyle: "glass",
    servingSize: "150ml",
    regularPrice: 15.00,
    dealPrice: 8.00,
    isOneForOne: false,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  },
  {
    title: "House Pour Wine (Red & White)",
    description: "Your choice of house pour red or white wine at special happy hour prices.",
    type: "drink",
    drinkCategory: "wine",
    isHousePour: true,
    servingStyle: "glass",
    servingSize: "150ml",
    regularPrice: 15.00,
    dealPrice: 8.00,
    isOneForOne: false,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  }
];

/**
 * Example Beer Deals
 */
export const beerDeals: Partial<InsertDeal>[] = [
  {
    title: "House Draft Beer",
    description: "House draft beer at happy hour prices - all day long!",
    type: "drink",
    drinkCategory: "beer",
    drinkSubcategory: "lager",
    isHousePour: true, 
    servingStyle: "pint",
    servingSize: "500ml",
    regularPrice: 15.00,
    dealPrice: 10.00,
    isOneForOne: false,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Everyday
  },
  {
    title: "Tiger Beer Bucket",
    description: "5 bottles of Tiger beer in a bucket of ice, perfect for sharing!",
    type: "drink",
    drinkCategory: "beer",
    drinkSubcategory: "lager",
    brand: "Tiger", // Brand is specified for bottle deals
    isHousePour: false,
    servingStyle: "bucket",
    servingSize: "5 x 330ml",
    regularPrice: 50.00,
    dealPrice: 35.00,
    isOneForOne: false,
    daysOfWeek: [4, 5, 6], // Thursday to Saturday
  },
  {
    title: "Craft Beer Taster Flight",
    description: "Try 4 of our craft beers in a tasting flight at special price",
    type: "drink",
    drinkCategory: "beer",
    drinkSubcategory: "craft",
    isHousePour: false,
    servingStyle: "flight",
    servingSize: "4 x 100ml",
    regularPrice: 24.00,
    dealPrice: 18.00,
    isOneForOne: false,
    daysOfWeek: [1, 2, 3], // Monday to Wednesday
  }
];

/**
 * Example Spirit Deals
 */
export const spiritDeals: Partial<InsertDeal>[] = [
  {
    title: "House Pour Spirits",
    description: "All house pour spirits (gin, whisky, vodka, rum) at happy hour prices",
    type: "drink",
    drinkCategory: "spirits",
    isHousePour: true,
    servingStyle: "glass",
    servingSize: "30ml",
    regularPrice: 15.00,
    dealPrice: 9.00,
    isOneForOne: false,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  },
  {
    title: "House Pour Whisky",
    description: "Our house pour whisky at special prices during happy hour",
    type: "drink",
    drinkCategory: "spirits",
    drinkSubcategory: "whisky",
    isHousePour: true,
    servingStyle: "glass",
    servingSize: "30ml",
    regularPrice: 16.00,
    dealPrice: 10.00,
    isOneForOne: false,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  },
  {
    title: "Monkey Shoulder Bottle",
    description: "Full bottle of Monkey Shoulder whisky at a special price",
    type: "drink",
    drinkCategory: "spirits",
    drinkSubcategory: "whisky",
    brand: "Monkey Shoulder", // Brand is specified for bottle deals
    isHousePour: false,
    servingStyle: "bottle",
    servingSize: "700ml",
    regularPrice: 180.00,
    dealPrice: 140.00,
    isOneForOne: false,
    daysOfWeek: [4, 5, 6], // Thursday to Saturday
  }
];

/**
 * Example Cocktail Deals
 */
export const cocktailDeals: Partial<InsertDeal>[] = [
  {
    title: "House Cocktails",
    description: "All our signature house cocktails at happy hour prices",
    type: "drink",
    drinkCategory: "cocktail",
    drinkSubcategory: "signature",
    isHousePour: true,
    servingStyle: "glass",
    servingSize: "150ml",
    regularPrice: 22.00,
    dealPrice: 15.00,
    isOneForOne: false,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  },
  {
    title: "Classic Cocktails 1-for-1",
    description: "Buy one classic cocktail, get one free! Choose from Mojito, Margarita, or Old Fashioned",
    type: "drink",
    drinkCategory: "cocktail",
    drinkSubcategory: "classic",
    isHousePour: false,
    servingStyle: "glass",
    servingSize: "150ml",
    regularPrice: 22.00,
    dealPrice: 22.00, // Same as regular price since it's 1-for-1
    isOneForOne: true,
    daysOfWeek: [3, 4], // Wednesday and Thursday
  }
];

/**
 * Example Food Deals
 */
export const foodDeals: Partial<InsertDeal>[] = [
  {
    title: "Bar Snacks",
    description: "Selected bar snacks at happy hour prices when you order drinks",
    type: "food",
    regularPrice: 15.00,
    dealPrice: 10.00,
    isOneForOne: false,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  },
  {
    title: "Nachos & Wings Combo",
    description: "A platter of nachos and buffalo wings at a special price",
    type: "food",
    regularPrice: 28.00,
    dealPrice: 20.00,
    isOneForOne: false,
    daysOfWeek: [4, 5, 6], // Thursday to Saturday
  }
];

/**
 * Example Combined Deals
 */
export const combinedDeals: Partial<InsertDeal>[] = [
  {
    title: "Drink & Appetizer Combo",
    description: "Any house pour drink with a selected appetizer at a combo price",
    type: "both", // Both food and drink
    regularPrice: 30.00,
    dealPrice: 22.00,
    isOneForOne: false,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  }
];

// Sample function to calculate savings percentage
export function calculateSavingsPercentage(regularPrice: number, dealPrice: number): number {
  return Math.round(((regularPrice - dealPrice) / regularPrice) * 100);
}