import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'restaurant']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'premium']);
export const dealStatusEnum = pgEnum('deal_status', ['active', 'upcoming', 'inactive']);
export const dealTypeEnum = pgEnum('deal_type', ['drink', 'food', 'both']);

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
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  imageUrl: text("image_url"),
  rating: doublePrecision("rating"),
  type: text("type").notNull(), // e.g. bar, restaurant, cafe
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Deals
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishment_id").notNull().references(() => establishments.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: dealStatusEnum("status").notNull().default('inactive'),
  type: dealTypeEnum("type").notNull(),
  regularPrice: doublePrecision("regular_price").notNull(),
  dealPrice: doublePrecision("deal_price").notNull(),
  savingsPercentage: doublePrecision("savings_percentage").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  daysOfWeek: json("days_of_week").notNull(), // Array of days (0-6, Sunday-Saturday)
  imageUrl: text("image_url"),
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
  savingsPercentage: true,
}).extend({
  daysOfWeek: z.array(z.number().min(0).max(6)),
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

// Define select types
export type User = typeof users.$inferSelect;
export type Establishment = typeof establishments.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type SavedDeal = typeof savedDeals.$inferSelect;
export type UserDealView = typeof userDealViews.$inferSelect;

// Extended types for API responses
export type DealWithEstablishment = Deal & {
  establishment: Establishment;
};

export type DealWithDetails = DealWithEstablishment & {
  reviews: Review[];
};
