import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'restaurant']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'premium']);
export const dealStatusEnum = pgEnum('deal_status', ['active', 'upcoming', 'inactive']);
export const dealTypeEnum = pgEnum('deal_type', ['drink', 'food', 'both']);
export const drinkCategoryEnum = pgEnum('drink_category', [
  'beer', 
  'wine', 
  'cocktail', 
  'spirits', 
  'non_alcoholic'
]);
export const drinkSubcategoryEnum = pgEnum('drink_subcategory', [
  // Beer subcategories
  'lager', 'ale', 'stout', 'ipa', 'craft',
  // Wine subcategories
  'red_wine', 'white_wine', 'rose_wine', 'sparkling_wine',
  // Spirit subcategories
  'whisky', 'gin', 'vodka', 'rum', 'tequila', 'brandy',
  // Cocktail subcategories
  'classic', 'signature', 'mocktail'
]);
export const servingStyleEnum = pgEnum('serving_style', [
  'glass', 'bottle', 'pint', 'flight', 'bucket'
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default('user'),
  subscriptionTier: subscriptionTierEnum("subscription_tier").notNull().default('free'),
  dealsViewed: integer("deals_viewed").notNull().default(0),
  totalSaved: doublePrecision("total_saved").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Establishments (restaurants, bars, etc.)
export const establishments = pgTable("establishments", {
  id: serial("id").primaryKey(),
  external_id: text("external_id"), // Custom ID in format SG0109, SG0110, etc.
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  imageUrl: text("image_url"),
  imageId: text("image_id"), // Cloudflare Images ID for establishment logo
  rating: doublePrecision("rating"),
  cuisine: text("cuisine").notNull(), // Changed from "type" to "cuisine"
  price: integer("price"), // Added price column (can be null)
  priority: integer("priority"), // Added priority column (can be null)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Simplified Deals table
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishment_id").notNull().references(() => establishments.id),
  
  // Alcohol categories
  alcohol_category: text("alcohol_category").notNull(), // e.g. Beer, Wine, Spirits
  alcohol_subcategory: text("alcohol_subcategory"), // e.g. Red wine, Whisky
  alcohol_subcategory2: text("alcohol_subcategory2"), // Optional additional subcategory
  drink_name: text("drink_name"), // e.g. Heineken, Sapporo, Monkey Shoulder
  
  // Pricing
  standard_price: doublePrecision("standard_price").notNull(),
  happy_hour_price: doublePrecision("happy_hour_price").notNull(),
  savings: doublePrecision("savings").notNull(),
  savings_percentage: integer("savings_percentage").notNull(),
  
  // Timing
  valid_days: text("valid_days").notNull(), // e.g. "Mon, Tue, Wed" or "Weekdays"
  hh_start_time: text("hh_start_time").notNull(), // Time in 24h format "17:00"
  hh_end_time: text("hh_end_time").notNull(), // Time in 24h format "19:00"
  
  // Collections and categorization
  collections: text("collections"), // Comma-separated collection names
  
  // Description of the deal
  description: text("description"), // Detailed description of the deal
  
  // Media and metadata
  imageUrl: text("image_url"),
  imageId: text("image_id"), // Cloudflare Images ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  dealId: integer("deal_id").notNull().references(() => deals.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Saved Deals
export const savedDeals = pgTable("saved_deals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  dealId: integer("deal_id").notNull().references(() => deals.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User Deal Views (for tracking)
export const userDealViews = pgTable("user_deal_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  dealId: integer("deal_id").notNull().references(() => deals.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
  savedDeals: many(savedDeals),
  dealViews: many(userDealViews),
}));

export const establishmentsRelations = relations(establishments, ({ many }) => ({
  deals: many(deals),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  establishment: one(establishments, {
    fields: [deals.establishmentId],
    references: [establishments.id],
  }),
  reviews: many(reviews),
  savedBy: many(savedDeals),
  viewedBy: many(userDealViews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [reviews.dealId],
    references: [deals.id],
  }),
}));

export const savedDealsRelations = relations(savedDeals, ({ one }) => ({
  user: one(users, {
    fields: [savedDeals.userId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [savedDeals.dealId],
    references: [deals.id],
  }),
}));

export const userDealViewsRelations = relations(userDealViews, ({ one }) => ({
  user: one(users, {
    fields: [userDealViews.userId],
    references: [users.id],
  }),
  deal: one(deals, {
    fields: [userDealViews.dealId],
    references: [deals.id],
  }),
}));

// Schema for inserting users
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Schema for inserting establishments
export const insertEstablishmentSchema = createInsertSchema(establishments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for inserting deals
export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  savings_percentage: true, // This is calculated based on standard and happy hour price
  savings: true, // This is calculated based on standard and happy hour price
});

// Schema for inserting reviews
export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Schema for inserting saved deals
export const insertSavedDealSchema = createInsertSchema(savedDeals).omit({
  id: true,
  createdAt: true,
});

// Collections table for managing displays and metadata
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // Technical ID like "beers_under_10"
  name: text("name").notNull(), // Display name like "Beers Under $10"
  description: text("description"), // Optional description
  priority: integer("priority"), // For ordering collections (lower = higher priority)
  icon: text("icon"), // Optional icon name/path
  active: boolean("active").notNull().default(true), // Whether to show this collection
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema for inserting collections
export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for inserting user deal views
export const insertUserDealViewSchema = createInsertSchema(userDealViews).omit({
  id: true,
  timestamp: true,
});

// Define types for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEstablishment = z.infer<typeof insertEstablishmentSchema>;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertSavedDeal = z.infer<typeof insertSavedDealSchema>;
export type InsertUserDealView = z.infer<typeof insertUserDealViewSchema>;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;

// Define select types
export type User = typeof users.$inferSelect;
export type Establishment = typeof establishments.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type SavedDeal = typeof savedDeals.$inferSelect;
export type UserDealView = typeof userDealViews.$inferSelect;
export type Collection = typeof collections.$inferSelect;

// Extended types for API responses
export type DealWithEstablishment = Deal & {
  establishment: Establishment;
};

export type DealWithDetails = DealWithEstablishment & {
  reviews: Review[];
};

// Helper types and constants for working with drink categories
export type DrinkCategory = 'beer' | 'wine' | 'cocktail' | 'spirits' | 'non_alcoholic';
export type WineType = 'red_wine' | 'white_wine' | 'rose_wine' | 'sparkling_wine';
export type SpiritType = 'whisky' | 'gin' | 'vodka' | 'rum' | 'tequila' | 'brandy';
export type BeerType = 'lager' | 'ale' | 'stout' | 'ipa' | 'craft';
export type ServingStyle = 'glass' | 'bottle' | 'pint' | 'flight' | 'bucket';

// Constants for categorization
export const WINE_TYPES: WineType[] = ['red_wine', 'white_wine', 'rose_wine', 'sparkling_wine'];
export const SPIRIT_TYPES: SpiritType[] = ['whisky', 'gin', 'vodka', 'rum', 'tequila', 'brandy'];
export const BEER_TYPES: BeerType[] = ['lager', 'ale', 'stout', 'ipa', 'craft'];

// Constants for display names
export const DRINK_CATEGORY_DISPLAY_NAMES: Record<DrinkCategory, string> = {
  beer: 'Beer',
  wine: 'Wine',
  cocktail: 'Cocktail',
  spirits: 'Spirits',
  non_alcoholic: 'Non-Alcoholic'
};

export const SUBCATEGORY_DISPLAY_NAMES: Record<string, string> = {
  // Wine types
  red_wine: 'Red Wine',
  white_wine: 'White Wine',
  rose_wine: 'Rosé Wine',
  sparkling_wine: 'Sparkling Wine',
  
  // Spirit types
  whisky: 'Whisky',
  gin: 'Gin',
  vodka: 'Vodka',
  rum: 'Rum',
  tequila: 'Tequila',
  brandy: 'Brandy',
  
  // Beer types
  lager: 'Lager',
  ale: 'Ale',
  stout: 'Stout',
  ipa: 'IPA',
  craft: 'Craft Beer',
  
  // Cocktail types
  classic: 'Classic Cocktail',
  signature: 'Signature Cocktail',
  mocktail: 'Mocktail'
};

// Helper function to calculate savings percentage for a deal
export function calculateSavingsPercentage(regularPrice: number, dealPrice: number): number {
  if (regularPrice <= 0) return 0;
  return Math.round(((regularPrice - dealPrice) / regularPrice) * 100);
}

// Singapore Locations table (for better location search)
export const singaporeLocations = pgTable("singapore_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),                     // Primary name (e.g., "Raffles Place")
  alternateNames: text("alternate_names"),          // Comma-separated alternative names/spellings
  postalCode: text("postal_code"),                  // Can be single code or range (e.g., "018956" or "018900-018999")
  postalDistrict: text("postal_district"),          // Postal district number (e.g., "01" for Central)
  area: text("area"),                               // North, South, East, West, Central
  latitude: doublePrecision("latitude").notNull(),  // Coordinates
  longitude: doublePrecision("longitude").notNull(),
  locationType: text("location_type"),              // neighborhood, mrt_station, landmark, mall, etc.
  isPopular: boolean("is_popular").default(false),  // Flag for popular locations
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema for inserting Singapore locations
export const insertSingaporeLocationSchema = createInsertSchema(singaporeLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define types for Singapore locations
export type InsertSingaporeLocation = z.infer<typeof insertSingaporeLocationSchema>;
export type SingaporeLocation = typeof singaporeLocations.$inferSelect;
