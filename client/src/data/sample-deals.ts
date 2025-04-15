// Sample deals for demonstration purposes
// These deals follow the format expected by our UI components

/**
 * Example House Pour Wine Deals
 */
export const houseWineDeals = [
  {
    title: "House Pour Red Wine",
    description: "Enjoy our house pour red wine at special prices during happy hour!",
    drinkCategory: "wine",
    drinkSubcategory: "red_wine",
    isHousePour: true,
    servingStyle: "glass",
    servingSize: "150ml",
    regularPrice: 15.00,
    dealPrice: 8.00,
    isOneForOne: false,
  },
  {
    title: "House Pour White Wine",
    description: "Enjoy our house pour white wine at special prices during happy hour!",
    drinkCategory: "wine",
    drinkSubcategory: "white_wine",
    isHousePour: true,
    servingStyle: "glass",
    servingSize: "150ml",
    regularPrice: 15.00,
    dealPrice: 8.00,
    isOneForOne: false,
  },
  {
    title: "Premium Wine by Glass",
    description: "Selected premium wines available by the glass at special happy hour prices",
    drinkCategory: "wine",
    isHousePour: false,
    servingStyle: "glass",
    servingSize: "150ml",
    regularPrice: 22.00,
    dealPrice: 15.00,
    isOneForOne: false,
  },
  {
    title: "1-for-1 House Wine",
    description: "Buy one glass of house wine, get one free!",
    drinkCategory: "wine",
    isHousePour: true,
    servingStyle: "glass", 
    servingSize: "150ml",
    regularPrice: 15.00,
    dealPrice: 15.00,
    isOneForOne: true,
  }
];

/**
 * Example Beer Deals
 */
export const beerDeals = [
  {
    title: "House Draft Beer",
    description: "House draft beer at happy hour prices all day long!",
    drinkCategory: "beer",
    drinkSubcategory: "lager",
    isHousePour: true, 
    servingStyle: "pint",
    servingSize: "500ml",
    regularPrice: 15.00,
    dealPrice: 9.00,
    isOneForOne: false,
  },
  {
    title: "Tiger Beer Pint",
    description: "Tiger beer on tap at happy hour prices",
    drinkCategory: "beer",
    drinkSubcategory: "lager",
    brand: "Tiger",
    isHousePour: false,
    servingStyle: "pint",
    servingSize: "500ml",
    regularPrice: 16.00,
    dealPrice: 10.00,
    isOneForOne: false,
  },
  {
    title: "Beer Bucket Special",
    description: "5 bottles of Tiger beer in a bucket of ice",
    drinkCategory: "beer",
    drinkSubcategory: "lager",
    brand: "Tiger",
    isHousePour: false,
    servingStyle: "bucket",
    servingSize: "5 x 330ml",
    regularPrice: 50.00,
    dealPrice: 35.00,
    isOneForOne: false,
  },
  {
    title: "Craft Beer Deal",
    description: "Rotating selection of craft beers at special prices",
    drinkCategory: "beer",
    drinkSubcategory: "craft",
    isHousePour: false,
    servingStyle: "glass",
    servingSize: "330ml",
    regularPrice: 18.00,
    dealPrice: 12.00,
    isOneForOne: false,
  },
  {
    title: "1-for-1 Draft Beer",
    description: "Buy one draft beer, get one free!",
    drinkCategory: "beer",
    isHousePour: true,
    servingStyle: "pint",
    servingSize: "500ml",
    regularPrice: 15.00,
    dealPrice: 15.00,
    isOneForOne: true,
  }
];

/**
 * Example Spirit Deals
 */
export const spiritDeals = [
  {
    title: "House Pour Spirits",
    description: "All house pour spirits at happy hour prices",
    drinkCategory: "spirits",
    isHousePour: true,
    servingStyle: "glass",
    servingSize: "30ml",
    regularPrice: 15.00,
    dealPrice: 8.00,
    isOneForOne: false,
  },
  {
    title: "Premium Whisky",
    description: "Selected premium whiskies at special prices",
    drinkCategory: "spirits",
    drinkSubcategory: "whisky",
    isHousePour: false,
    servingStyle: "glass",
    servingSize: "30ml",
    regularPrice: 25.00,
    dealPrice: 18.00,
    isOneForOne: false,
  },
  {
    title: "Gin & Tonic Special",
    description: "Gin & tonic made with Bombay Sapphire",
    drinkCategory: "spirits", 
    drinkSubcategory: "gin",
    brand: "Bombay Sapphire",
    isHousePour: false,
    servingStyle: "glass",
    servingSize: "240ml",
    regularPrice: 20.00,
    dealPrice: 14.00,
    isOneForOne: false,
  },
  {
    title: "1-for-1 House Spirits",
    description: "Buy one house spirit, get one free!",
    drinkCategory: "spirits",
    isHousePour: true,
    servingStyle: "glass",
    servingSize: "30ml",
    regularPrice: 15.00,
    dealPrice: 15.00,
    isOneForOne: true,
  }
];

/**
 * Example Cocktail Deals
 */
export const cocktailDeals = [
  {
    title: "House Cocktails",
    description: "Our signature cocktails at happy hour prices",
    drinkCategory: "cocktail",
    drinkSubcategory: "signature",
    isHousePour: true,
    servingStyle: "glass",
    servingSize: "150ml",
    regularPrice: 22.00,
    dealPrice: 16.00,
    isOneForOne: false,
  },
  {
    title: "Classic Mojito",
    description: "Classic mojito cocktail at special price",
    drinkCategory: "cocktail",
    drinkSubcategory: "classic",
    isHousePour: false,
    servingStyle: "glass",
    servingSize: "240ml",
    regularPrice: 20.00,
    dealPrice: 15.00,
    isOneForOne: false,
  },
  {
    title: "1-for-1 Classic Cocktails",
    description: "Buy one classic cocktail, get one free! Choose from Mojito, Margarita, or Old Fashioned",
    drinkCategory: "cocktail",
    drinkSubcategory: "classic",
    isHousePour: false,
    servingStyle: "glass",
    servingSize: "150ml",
    regularPrice: 22.00,
    dealPrice: 22.00,
    isOneForOne: true,
  }
];