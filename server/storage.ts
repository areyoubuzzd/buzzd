import { 
  users, type User, type InsertUser,
  deals, type Deal, type InsertDeal,
  establishments, type Establishment, type InsertEstablishment,
  reviews, type Review, type InsertReview,
  savedDeals, type SavedDeal, type InsertSavedDeal,
  userDealViews, type UserDealView, type InsertUserDealView,
  type DealWithEstablishment,
  type DealWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, inArray, sql, desc, asc, or, lt, gt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { Pool } from "@neondatabase/serverless";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

/**
 * Convert a date to Singapore time (GMT+8)
 * Use this for all time calculations to ensure consistency
 */
function getSingaporeTime(date = new Date()): Date {
  // Add the timezone offset to get to UTC, then add 8 hours for Singapore time
  return new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (8 * 60 * 60000));
}

// Storage interface
export interface IStorage {
  // User related
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(userId: number, tier: 'free' | 'premium'): Promise<User>;
  updateUserSavings(userId: number, amount: number): Promise<User>;
  incrementUserDealViews(userId: number): Promise<User>;
  
  // Establishments
  getAllEstablishments(): Promise<Establishment[]>;
  getEstablishment(id: number): Promise<Establishment | undefined>;
  createEstablishment(establishment: InsertEstablishment): Promise<Establishment>;
  updateEstablishment(id: number, data: Partial<InsertEstablishment>): Promise<Establishment>;
  getEstablishmentsNearby(latitude: number, longitude: number, radiusKm: number): Promise<Establishment[]>;
  
  // Deals
  getDeal(id: number): Promise<DealWithEstablishment | undefined>;
  getDealDetails(id: number): Promise<DealWithDetails | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, data: Partial<InsertDeal>): Promise<Deal>;
  getActiveDeals(latitude: number, longitude: number, radiusKm: number): Promise<DealWithEstablishment[]>;
  getUpcomingDeals(latitude: number, longitude: number, radiusKm: number): Promise<DealWithEstablishment[]>;
  getFutureDeals(latitude: number, longitude: number, radiusKm: number): Promise<DealWithEstablishment[]>;
  getActiveDealsForEstablishment(establishmentId: number): Promise<Deal[]>;
  getDealsForEstablishment(establishmentId: number): Promise<Deal[]>;
  isDealActiveNow(deal: Deal): boolean;
  searchDeals(query: string, filters: { type?: string, status?: string }): Promise<DealWithEstablishment[]>;
  
  // Reviews
  getReviewsForDeal(dealId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Saved Deals
  getSavedDealsForUser(userId: number): Promise<DealWithEstablishment[]>;
  saveDeal(data: InsertSavedDeal): Promise<SavedDeal>;
  unsaveDeal(userId: number, dealId: number): Promise<void>;
  
  // User Deal Views
  recordDealView(data: InsertUserDealView): Promise<UserDealView>;
  getUserDealViews(userId: number): Promise<UserDealView[]>;
  getUserSavings(userId: number): Promise<number>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    // Use Postgres for session store in production, memory store for development
    if (process.env.NODE_ENV === 'production') {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      this.sessionStore = new PostgresSessionStore({ 
        pool, 
        createTableIfMissing: true 
      });
    } else {
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserSubscription(userId: number, tier: 'free' | 'premium'): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ subscriptionTier: tier })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSavings(userId: number, amount: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        totalSaved: sql`${users.totalSaved} + ${amount}` 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async incrementUserDealViews(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        dealsViewed: sql`${users.dealsViewed} + 1` 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Establishment methods
  async getAllEstablishments(): Promise<Establishment[]> {
    return db.select().from(establishments).orderBy(asc(establishments.name));
  }

  async getEstablishment(id: number): Promise<Establishment | undefined> {
    const [establishment] = await db.select().from(establishments).where(eq(establishments.id, id));
    return establishment;
  }

  async createEstablishment(establishment: InsertEstablishment): Promise<Establishment> {
    const [newEstablishment] = await db.insert(establishments).values(establishment).returning();
    return newEstablishment;
  }

  async updateEstablishment(id: number, data: Partial<InsertEstablishment>): Promise<Establishment> {
    const [updatedEstablishment] = await db
      .update(establishments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(establishments.id, id))
      .returning();
    return updatedEstablishment;
  }

  async getEstablishmentsNearby(latitude: number, longitude: number, radiusKm: number): Promise<Establishment[]> {
    // Using the Haversine formula to calculate distance
    const haversine = sql`
      2 * 6371 * asin(
        sqrt(
          pow(sin((radians(${latitude}) - radians(${establishments.latitude})) / 2), 2) +
          cos(radians(${latitude})) * cos(radians(${establishments.latitude})) *
          pow(sin((radians(${longitude}) - radians(${establishments.longitude})) / 2), 2)
        )
      )
    `;

    const nearbyEstablishments = await db
      .select()
      .from(establishments)
      .where(sql`${haversine} <= ${radiusKm}`);

    return nearbyEstablishments;
  }

  // Deal methods
  async getDeal(id: number): Promise<DealWithEstablishment | undefined> {
    const result = await db
      .select({
        deal: deals,
        establishment: establishments
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id))
      .where(eq(deals.id, id));

    if (result.length === 0) return undefined;

    return {
      ...result[0].deal,
      establishment: result[0].establishment
    };
  }

  async getDealDetails(id: number): Promise<DealWithDetails | undefined> {
    const dealWithEstablishment = await this.getDeal(id);
    if (!dealWithEstablishment) return undefined;

    const dealReviews = await this.getReviewsForDeal(id);

    return {
      ...dealWithEstablishment,
      reviews: dealReviews
    };
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    // Calculate savings percentage
    const savingsPercentage = 
      ((deal.regularPrice - deal.dealPrice) / deal.regularPrice) * 100;

    const dealWithSavings = {
      ...deal,
      savingsPercentage
    };

    const [newDeal] = await db.insert(deals).values(dealWithSavings).returning();
    return newDeal;
  }

  async updateDeal(id: number, data: Partial<InsertDeal>): Promise<Deal> {
    let dealData = { ...data };
    
    // If prices are being updated, recalculate savings percentage
    if (data.regularPrice !== undefined || data.dealPrice !== undefined) {
      const [currentDeal] = await db.select().from(deals).where(eq(deals.id, id));
      
      const regularPrice = data.regularPrice ?? currentDeal.regularPrice;
      const dealPrice = data.dealPrice ?? currentDeal.dealPrice;
      
      dealData.savingsPercentage = 
        ((regularPrice - dealPrice) / regularPrice) * 100;
    }

    const [updatedDeal] = await db
      .update(deals)
      .set({ ...dealData, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    
    return updatedDeal;
  }

  async getActiveDeals(latitude: number, longitude: number, radiusKm: number): Promise<DealWithEstablishment[]> {
    // Convert to Singapore time (GMT+8)
    const now = getSingaporeTime();
    // Add the timezone offset to get to UTC, then add 8 hours for Singapore time
    const singaporeTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 60 * 60000));
    const currentDay = singaporeTime.getDay(); // 0-6, where 0 is Sunday
    const currentTime = singaporeTime.toTimeString().substring(0, 5); // Format: "HH:MM"
    
    // Get the current day of the week in the format used in the valid_days field
    const dayMap: Record<number, string> = {
      0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
    };
    const currentDayStr = dayMap[currentDay];
    
    // If valid_days contains "Weekdays", we need to check if today is a weekday
    const isWeekday = currentDay >= 1 && currentDay <= 5; // Monday to Friday

    // Using the Haversine formula to calculate distance
    const haversine = sql`
      2 * 6371 * asin(
        sqrt(
          pow(sin((radians(${latitude}) - radians(${establishments.latitude})) / 2), 2) +
          cos(radians(${latitude})) * cos(radians(${establishments.latitude})) *
          pow(sin((radians(${longitude}) - radians(${establishments.longitude})) / 2), 2)
        )
      )
    `;

    const result = await db
      .select({
        deal: deals,
        establishment: establishments,
        distance: haversine
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id))
      .where(and(
        or(
          and(
            // Happy hour time window (normal case, start time before end time)
            lte(deals.hh_start_time, currentTime),
            gte(deals.hh_end_time, currentTime),
            or(
              // Day validation: Valid for current day, weekday, or everyday
              sql`${deals.valid_days} LIKE '%${currentDayStr}%'`,
              and(
                sql`${deals.valid_days} LIKE '%Weekdays%'`,
                eq(sql`1`, isWeekday ? 1 : 0)
              ),
              sql`${deals.valid_days} LIKE '%Everyday%'`
            )
          ),
          // Special case for happy hours that span midnight
          and(
            gte(deals.hh_start_time, deals.hh_end_time),
            or(
              gte(currentTime, deals.hh_start_time),
              lte(currentTime, deals.hh_end_time)
            ),
            or(
              // Day validation: Valid for current day, weekday, or everyday
              sql`${deals.valid_days} LIKE '%${currentDayStr}%'`,
              and(
                sql`${deals.valid_days} LIKE '%Weekdays%'`,
                eq(sql`1`, isWeekday ? 1 : 0)
              ),
              sql`${deals.valid_days} LIKE '%Everyday%'`
            )
          )
        ),
        // Only include deals within the specified radius
        lte(haversine, radiusKm)
      ))
      .orderBy(asc(haversine))
      .limit(50);

    return result.filter(item => item.distance <= radiusKm).map(item => ({
      ...item.deal,
      establishment: item.establishment
    }));
  }

  async getUpcomingDeals(latitude: number, longitude: number, radiusKm: number): Promise<DealWithEstablishment[]> {
    // Convert to Singapore time (GMT+8)
    const now = getSingaporeTime();
    // Add the timezone offset to get to UTC, then add 8 hours for Singapore time
    const singaporeTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 60 * 60000));
    const nowTime = singaporeTime.toTimeString().substring(0, 5); // Format: "HH:MM"
    const oneHourLater = new Date(singaporeTime.getTime() + 3600000); // 1 hour later
    const oneHourLaterTime = oneHourLater.toTimeString().substring(0, 5);
    const currentDay = singaporeTime.getDay(); // 0-6, where 0 is Sunday
    
    // Get the current day of the week in the format used in the valid_days field
    const dayMap: Record<number, string> = {
      0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
    };
    const currentDayStr = dayMap[currentDay];
    
    // If valid_days contains "Weekdays", we need to check if today is a weekday
    const isWeekday = currentDay >= 1 && currentDay <= 5; // Monday to Friday

    // Using the Haversine formula to calculate distance
    const haversine = sql`
      2 * 6371 * asin(
        sqrt(
          pow(sin((radians(${latitude}) - radians(${establishments.latitude})) / 2), 2) +
          cos(radians(${latitude})) * cos(radians(${establishments.latitude})) *
          pow(sin((radians(${longitude}) - radians(${establishments.longitude})) / 2), 2)
        )
      )
    `;

    const result = await db
      .select({
        deal: deals,
        establishment: establishments,
        distance: haversine
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id))
      .where(and(
        // Deal starting in the next hour
        sql`${deals.hh_start_time} > ${nowTime}`,
        sql`${deals.hh_start_time} <= ${oneHourLaterTime}`,
        // Valid for today
        or(
          sql`${deals.valid_days} LIKE ${'%' + currentDayStr + '%'}`,
          and(
            sql`${deals.valid_days} LIKE ${'%Weekdays%'}`,
            sql`${isWeekday}`
          ),
          sql`${deals.valid_days} LIKE ${'%Everyday%'}`
        ),
        // Only include deals within the specified radius
        sql`${haversine} <= ${radiusKm}`
      ))
      .orderBy(asc(haversine))
      .limit(50);

    return result.map(item => ({
      ...item.deal,
      establishment: item.establishment
    }));
  }

  async getFutureDeals(latitude: number, longitude: number, radiusKm: number): Promise<DealWithEstablishment[]> {
    // Get tomorrow's day in Singapore time (GMT+8)
    const now = getSingaporeTime();
    // Add the timezone offset to get to UTC, then add 8 hours for Singapore time
    const singaporeTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 60 * 60000));
    const tomorrow = new Date(singaporeTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDay(); // 0-6, where 0 is Sunday
    
    // Get the day of the week in the format used in the valid_days field
    const dayMap: Record<number, string> = {
      0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
    };
    const tomorrowDayStr = dayMap[tomorrowDay];
    
    // If valid_days contains "Weekdays", we need to check if tomorrow is a weekday
    const isTomorrowWeekday = tomorrowDay >= 1 && tomorrowDay <= 5; // Monday to Friday

    // Using the Haversine formula to calculate distance
    const haversine = sql`
      2 * 6371 * asin(
        sqrt(
          pow(sin((radians(${latitude}) - radians(${establishments.latitude})) / 2), 2) +
          cos(radians(${latitude})) * cos(radians(${establishments.latitude})) *
          pow(sin((radians(${longitude}) - radians(${establishments.longitude})) / 2), 2)
        )
      )
    `;

    const result = await db
      .select({
        deal: deals,
        establishment: establishments,
        distance: haversine
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id))
      .where(and(
        // Valid for tomorrow
        or(
          sql`${deals.valid_days} LIKE ${'%' + tomorrowDayStr + '%'}`,
          and(
            sql`${deals.valid_days} LIKE ${'%Weekdays%'}`,
            sql`${isTomorrowWeekday}`
          ),
          sql`${deals.valid_days} LIKE ${'%Everyday%'}`
        ),
        // Only include deals within the specified radius
        sql`${haversine} <= ${radiusKm}`
      ))
      .orderBy(asc(haversine))
      .limit(50);

    return result.filter(item => item.distance <= radiusKm).map(item => ({
      ...item.deal,
      establishment: item.establishment
    }));
  }
  
  /**
   * Helper method to check if a deal is currently active
   * Based on the current time and day
   */
  isDealActiveNow(deal: Deal): boolean {
    try {
      // Get current Singapore time for day/time validation
      const singaporeTime = getSingaporeTime();
      const currentDay = singaporeTime.getDay(); // 0-6, where 0 is Sunday
      const currentTime = singaporeTime.toTimeString().substring(0, 5); // Format: "HH:MM"
      // Convert current time to a numeric value for easier comparison (e.g., "13:45" -> 1345)
      const currentTimeValue = parseInt(currentTime.replace(':', ''));
      
      // Get the current day of the week in the format used in the valid_days field
      const dayMap: Record<number, string> = {
        0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
      };
      const currentDayStr = dayMap[currentDay].toLowerCase();
      
      // Check if today is a weekday (for "Weekdays" deals)
      const isWeekday = currentDay >= 1 && currentDay <= 5; // Monday to Friday
      
      // Check if the deal is valid for today's day of the week
      const validDays = deal.valid_days.toLowerCase();
      const isValidDay = validDays.includes('all days') || 
                         validDays.includes(currentDayStr) || 
                         (validDays.includes('weekdays') && isWeekday) ||
                         validDays.includes('everyday');
      
      if (!isValidDay) {
        return false;
      }
      
      // Convert happy hour start and end times to numeric values for comparison
      const startTime = deal.hh_start_time;
      const endTime = deal.hh_end_time;
      const startTimeValue = parseInt(startTime.replace(':', ''));
      const endTimeValue = parseInt(endTime.replace(':', ''));
      
      // Check if the deal is active at the current time
      if (startTimeValue <= endTimeValue) {
        // Normal case: start time is before end time (e.g., 12:00 - 14:00)
        return currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
      } else {
        // Special case: happy hour spans midnight (e.g., 22:00 - 02:00)
        return currentTimeValue >= startTimeValue || currentTimeValue <= endTimeValue;
      }
    } catch (error) {
      console.error("Error checking if deal is active:", error);
      return false;
    }
  }
  
  /**
   * Get all deals for a specific establishment
   * This returns ALL deals, not just active ones
   */
  async getDealsForEstablishment(establishmentId: number): Promise<Deal[]> {
    try {
      return await db
        .select()
        .from(deals)
        .where(eq(deals.establishmentId, establishmentId))
        .orderBy(asc(deals.alcohol_category), asc(deals.happy_hour_price));
    } catch (error) {
      console.error("Error fetching deals for establishment:", error);
      return [];
    }
  }
  
  /**
   * Get all active deals for a specific establishment
   * This method is used in the deal-to-restaurant workflow
   */
  async getActiveDealsForEstablishment(establishmentId: number): Promise<Deal[]> {
    try {
      // Get current Singapore time for day/time validation
      const singaporeTime = getSingaporeTime();
      const currentDay = singaporeTime.getDay(); // 0-6, where 0 is Sunday
      const currentTime = singaporeTime.toTimeString().substring(0, 5); // Format: "HH:MM"
      // Convert current time to a numeric value for easier comparison (e.g., "13:45" -> 1345)
      const currentTimeValue = parseInt(currentTime.replace(':', ''));
      
      // Get the current day of the week in the format used in the valid_days field
      const dayMap: Record<number, string> = {
        0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
      };
      const currentDayStr = dayMap[currentDay].toLowerCase();
      
      // Check if today is a weekday (for "Weekdays" deals)
      const isWeekday = currentDay >= 1 && currentDay <= 5; // Monday to Friday
      
      // Get all deals for the establishment
      const dealsForEstablishment = await db
        .select()
        .from(deals)
        .where(eq(deals.establishmentId, establishmentId))
        .orderBy(asc(deals.alcohol_category), asc(deals.happy_hour_price));
      
      // For debugging - log the first deal
      if (dealsForEstablishment.length > 0) {
        console.log('First deal for establishment:', dealsForEstablishment[0]);
      } else {
        console.log('No deals found for establishment:', establishmentId);
      }
      
      // Process each deal to determine if it's active now
      // Return all deals but mark each with "isActive" flag
      const dealsWithActiveStatus = dealsForEstablishment.map(deal => {
        // Check if the deal is valid for today
        let isValidDay = false;
        
        // Handle various day format cases
        const validDaysLower = deal.valid_days.toLowerCase();
        
        // Case: "all days" or "daily"
        if (validDaysLower === 'all days' || validDaysLower === 'daily') {
          isValidDay = true;
          console.log(`Deal ${deal.id} (${deal.drink_name}) valid days: "${deal.valid_days}"`);
        }
        // Case: "weekdays" 
        else if (validDaysLower === 'weekdays') {
          isValidDay = isWeekday;
          console.log(`Deal ${deal.id} (${deal.drink_name}) valid days: "${deal.valid_days}"`);
          console.log(`Is weekday: ${isWeekday}`);
        }
        // Case: "weekends"
        else if (validDaysLower === 'weekends') {
          isValidDay = !isWeekday;
          console.log(`Deal ${deal.id} (${deal.drink_name}) valid days: "${deal.valid_days}"`);
          console.log(`Is weekend: ${!isWeekday}`);
        }
        // Case: day ranges like "mon-fri", "thu-sun"
        else if (validDaysLower.includes('-')) {
          const [startDay, endDay] = validDaysLower.split('-').map(d => d.trim());
          
          // Find the indices of the days in our ordered array
          const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
          const startIdx = dayOrder.indexOf(startDay);
          const endIdx = dayOrder.indexOf(endDay);
          const currentIdx = dayOrder.indexOf(currentDayStr);
          
          // Make sure all required days are found
          if (startIdx !== -1 && endIdx !== -1 && currentIdx !== -1) {
            // Range check
            if (startIdx <= endIdx) {
              // Normal range (e.g., mon-fri)
              isValidDay = currentIdx >= startIdx && currentIdx <= endIdx;
            } else {
              // Wrapping range (e.g., fri-mon) - includes fri, sat, sun, mon
              isValidDay = currentIdx >= startIdx || currentIdx <= endIdx;
            }
            console.log(`Range check: ${startIdx} <= ${currentIdx} <= ${endIdx} => ${isValidDay}`);
          }
          console.log(`Deal ${deal.id} (${deal.drink_name}) valid days: "${deal.valid_days}"`);
        }
        // Case: comma-separated list like "mon, wed, fri"
        else if (validDaysLower.includes(',')) {
          const validDays = validDaysLower.split(',').map(d => d.trim());
          isValidDay = validDays.includes(currentDayStr);
          console.log(`Deal ${deal.id} (${deal.drink_name}) valid days: "${deal.valid_days}"`);
        }
        // Case: single day
        else {
          isValidDay = validDaysLower.trim() === currentDayStr;
          console.log(`Deal ${deal.id} (${deal.drink_name}) valid days: "${deal.valid_days}"`);
        }
        
        // If the day isn't valid, no need to check the time
        if (!isValidDay) {
          return { ...deal, isActive: false };
        }
        
        // Now check the time
        console.log(`Current time value: ${currentTimeValue}`);
        
        // Parse start and end times to numeric values for comparison
        let startTimeValue = 0;
        let endTimeValue = 0;
        
        // Format times like "09:00" or "17:30" to 900 or 1730 for easier comparison
        if (deal.hh_start_time.includes(':')) {
          startTimeValue = parseInt(deal.hh_start_time.replace(':', ''));
        } else {
          startTimeValue = parseInt(deal.hh_start_time);
        }
        
        if (deal.hh_end_time.includes(':')) {
          endTimeValue = parseInt(deal.hh_end_time.replace(':', ''));
        } else {
          endTimeValue = parseInt(deal.hh_end_time);
        }
        
        console.log(`Start time raw: "${deal.hh_start_time}", parsed: ${startTimeValue}`);
        console.log(`End time raw: "${deal.hh_end_time}", parsed: ${endTimeValue}`);
        
        // Check if current time is within happy hour
        let isHappyHourNow = false;
        if (startTimeValue <= endTimeValue) {
          // Normal case: start time is before end time (e.g., 17:00 - 19:00)
          isHappyHourNow = currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
          if (isHappyHourNow) {
            console.log(`Deal "${deal.drink_name}" from establishment ${establishmentId} is ACTIVE (${currentTimeValue} is between ${startTimeValue} and ${endTimeValue})`);
          } else {
            console.log(`Deal "${deal.drink_name}" is NOT active: time ${currentTimeValue} is NOT between ${startTimeValue} and ${endTimeValue}`);
          }
        } else {
          // Special case: happy hour spans midnight (e.g., 22:00 - 02:00)
          isHappyHourNow = currentTimeValue >= startTimeValue || currentTimeValue <= endTimeValue;
          if (isHappyHourNow) {
            console.log(`Deal "${deal.drink_name}" from establishment ${establishmentId} is ACTIVE (overnight: ${currentTimeValue} is outside ${startTimeValue} to ${endTimeValue})`);
          } else {
            console.log(`Deal "${deal.drink_name}" is NOT active: time ${currentTimeValue} is NOT outside ${startTimeValue} to ${endTimeValue}`);
          }
        }
        
        // Return the deal with its active status
        return { ...deal, isActive: isHappyHourNow };
      });
      
      // Return all deals with their active status
      return dealsWithActiveStatus;
    } catch (error) {
      console.error("Error fetching deals for establishment:", error);
      return [];
    }
  }

  async searchDeals(query: string, filters: { type?: string, status?: string }): Promise<DealWithEstablishment[]> {
    const searchConditions = [];
    
    // Add text search condition if query is provided
    if (query) {
      const searchTerm = `%${query}%`;
      searchConditions.push(
        or(
          sql`${deals.drink_name} ILIKE ${searchTerm}`,
          sql`${deals.alcohol_category} ILIKE ${searchTerm}`,
          sql`${deals.alcohol_subcategory} ILIKE ${searchTerm}`,
          sql`${establishments.name} ILIKE ${searchTerm}`,
          sql`${establishments.address} ILIKE ${searchTerm}`,
          sql`${establishments.city} ILIKE ${searchTerm}`,
          sql`${establishments.postalCode} ILIKE ${searchTerm}`
        )
      );
    }
    
    // Add type filter if provided (alcohol category)
    if (filters.type) {
      searchConditions.push(eq(deals.alcohol_category, filters.type));
    }
    
    // Add status filter if provided (active/inactive based on time)
    if (filters.status === 'active') {
      const singaporeTime = getSingaporeTime();
      const currentDay = singaporeTime.getDay(); // 0-6, where 0 is Sunday
      const currentTime = singaporeTime.toTimeString().substring(0, 5); // Format: "HH:MM"
      
      // Get the current day of the week in the format used in the valid_days field
      const dayMap: Record<number, string> = {
        0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
      };
      const currentDayStr = dayMap[currentDay];
      
      // If valid_days contains "Weekdays", we need to check if today is a weekday
      const isWeekday = currentDay >= 1 && currentDay <= 5; // Monday to Friday
      
      searchConditions.push(
        or(
          and(
            lte(deals.hh_start_time, currentTime),
            gte(deals.hh_end_time, currentTime),
            or(
              sql`${deals.valid_days} LIKE ${'%' + currentDayStr + '%'}`,
              and(
                sql`${deals.valid_days} LIKE ${'%Weekdays%'}`,
                sql`${isWeekday}`
              ),
              sql`${deals.valid_days} LIKE ${'%Everyday%'}`
            )
          ),
          // Special case for happy hours that span midnight
          and(
            gte(deals.hh_start_time, deals.hh_end_time),
            or(
              gte(currentTime, deals.hh_start_time),
              lte(currentTime, deals.hh_end_time)
            ),
            or(
              sql`${deals.valid_days} LIKE ${'%' + currentDayStr + '%'}`,
              and(
                sql`${deals.valid_days} LIKE ${'%Weekdays%'}`,
                sql`${isWeekday}`
              ),
              sql`${deals.valid_days} LIKE ${'%Everyday%'}`
            )
          )
        )
      );
    }
    
    const result = await db
      .select({
        deal: deals,
        establishment: establishments
      })
      .from(deals)
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id))
      .where(and(...searchConditions))
      .orderBy(asc(deals.alcohol_category), asc(deals.happy_hour_price))
      .limit(100);
    
    return result.map(item => ({
      ...item.deal,
      establishment: item.establishment
    }));
  }

  // Review methods
  async getReviewsForDeal(dealId: number): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.dealId, dealId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  // Saved Deals methods
  async getSavedDealsForUser(userId: number): Promise<DealWithEstablishment[]> {
    const result = await db
      .select({
        deal: deals,
        establishment: establishments
      })
      .from(savedDeals)
      .innerJoin(deals, eq(savedDeals.dealId, deals.id))
      .innerJoin(establishments, eq(deals.establishmentId, establishments.id))
      .where(eq(savedDeals.userId, userId))
      .orderBy(desc(savedDeals.createdAt));
    
    return result.map(item => ({
      ...item.deal,
      establishment: item.establishment
    }));
  }

  async saveDeal(data: InsertSavedDeal): Promise<SavedDeal> {
    // Check if already saved
    const [existing] = await db
      .select()
      .from(savedDeals)
      .where(and(
        eq(savedDeals.userId, data.userId),
        eq(savedDeals.dealId, data.dealId)
      ));
    
    if (existing) {
      return existing;
    }
    
    const [savedDeal] = await db.insert(savedDeals).values(data).returning();
    return savedDeal;
  }

  async unsaveDeal(userId: number, dealId: number): Promise<void> {
    await db
      .delete(savedDeals)
      .where(and(
        eq(savedDeals.userId, userId),
        eq(savedDeals.dealId, dealId)
      ));
  }

  // User Deal Views methods
  async recordDealView(data: InsertUserDealView): Promise<UserDealView> {
    const [dealView] = await db.insert(userDealViews).values(data).returning();
    await this.incrementUserDealViews(data.userId);
    return dealView;
  }

  async getUserDealViews(userId: number): Promise<UserDealView[]> {
    return db
      .select()
      .from(userDealViews)
      .where(eq(userDealViews.userId, userId))
      .orderBy(desc(userDealViews.timestamp));
  }

  async getUserSavings(userId: number): Promise<number> {
    // Get all unique deals viewed by the user
    const viewedDeals = await db
      .select({ dealId: userDealViews.dealId })
      .from(userDealViews)
      .where(eq(userDealViews.userId, userId))
      .groupBy(userDealViews.dealId);

    if (viewedDeals.length === 0) {
      return 0;
    }

    // Get savings for those deals
    const dealIds = viewedDeals.map(view => view.dealId);
    
    const dealPrices = await db
      .select({
        standard_price: deals.standard_price,
        happy_hour_price: deals.happy_hour_price
      })
      .from(deals)
      .where(inArray(deals.id, dealIds));

    // Calculate total savings
    const totalSavings = dealPrices.reduce(
      (sum, deal) => sum + (deal.standard_price - deal.happy_hour_price),
      0
    );

    return totalSavings;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private establishments: Map<number, Establishment>;
  private deals: Map<number, Deal>;
  private reviews: Map<number, Review[]>;
  private savedDeals: Map<number, SavedDeal[]>;
  private userDealViews: Map<number, UserDealView[]>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private establishmentIdCounter: number;
  private dealIdCounter: number;
  private reviewIdCounter: number;
  private savedDealIdCounter: number;
  private userDealViewIdCounter: number;

  constructor() {
    this.users = new Map();
    this.establishments = new Map();
    this.deals = new Map();
    this.reviews = new Map();
    this.savedDeals = new Map();
    this.userDealViews = new Map();
    
    this.userIdCounter = 1;
    this.establishmentIdCounter = 1;
    this.dealIdCounter = 1;
    this.reviewIdCounter = 1;
    this.savedDealIdCounter = 1;
    this.userDealViewIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = getSingaporeTime();
    const user: User = { 
      ...insertUser, 
      id, 
      role: 'user',
      subscriptionTier: 'free',
      dealsViewed: 0,
      totalSaved: 0,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserSubscription(userId: number, tier: 'free' | 'premium'): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, subscriptionTier: tier };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserSavings(userId: number, amount: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, totalSaved: user.totalSaved + amount };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async incrementUserDealViews(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, dealsViewed: user.dealsViewed + 1 };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Establishment methods
  async getAllEstablishments(): Promise<Establishment[]> {
    return Array.from(this.establishments.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getEstablishment(id: number): Promise<Establishment | undefined> {
    return this.establishments.get(id);
  }

  async createEstablishment(establishment: InsertEstablishment): Promise<Establishment> {
    const id = this.establishmentIdCounter++;
    const now = getSingaporeTime();
    const newEstablishment: Establishment = { 
      ...establishment, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.establishments.set(id, newEstablishment);
    return newEstablishment;
  }

  async updateEstablishment(id: number, data: Partial<InsertEstablishment>): Promise<Establishment> {
    const establishment = this.establishments.get(id);
    if (!establishment) throw new Error('Establishment not found');
    
    const updatedEstablishment = { 
      ...establishment, 
      ...data,
      updatedAt: new Date()
    };
    this.establishments.set(id, updatedEstablishment);
    return updatedEstablishment;
  }

  async getEstablishmentsNearby(latitude: number, longitude: number, radiusKm: number): Promise<Establishment[]> {
    // Simple distance calculation for memory storage
    const nearby = Array.from(this.establishments.values()).filter(establishment => {
      const distance = this.calculateDistance(
        latitude, longitude,
        establishment.latitude, establishment.longitude
      );
      return distance <= radiusKm;
    });
    
    return nearby;
  }

  // Deal methods
  async getDeal(id: number): Promise<DealWithEstablishment | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;
    
    const establishment = this.establishments.get(deal.establishmentId);
    if (!establishment) return undefined;
    
    return {
      ...deal,
      establishment
    };
  }

  async getDealDetails(id: number): Promise<DealWithDetails | undefined> {
    const dealWithEstablishment = await this.getDeal(id);
    if (!dealWithEstablishment) return undefined;
    
    const dealReviews = this.reviews.get(id) || [];
    
    return {
      ...dealWithEstablishment,
      reviews: dealReviews
    };
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const id = this.dealIdCounter++;
    const now = getSingaporeTime();
    
    // Calculate savings percentage
    const savingsPercentage = 
      ((deal.regularPrice - deal.dealPrice) / deal.regularPrice) * 100;
    
    const newDeal: Deal = {
      ...deal,
      id,
      savingsPercentage,
      createdAt: now,
      updatedAt: now
    };
    
    this.deals.set(id, newDeal);
    return newDeal;
  }

  async updateDeal(id: number, data: Partial<InsertDeal>): Promise<Deal> {
    const deal = this.deals.get(id);
    if (!deal) throw new Error('Deal not found');
    
    // Calculate new savings percentage if prices were updated
    let savingsPercentage = deal.savingsPercentage;
    if (data.regularPrice !== undefined || data.dealPrice !== undefined) {
      const regularPrice = data.regularPrice ?? deal.regularPrice;
      const dealPrice = data.dealPrice ?? deal.dealPrice;
      savingsPercentage = ((regularPrice - dealPrice) / regularPrice) * 100;
    }
    
    const updatedDeal = {
      ...deal,
      ...data,
      savingsPercentage,
      updatedAt: new Date()
    };
    
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async getActiveDeals(latitude: number, longitude: number, radiusKm: number): Promise<DealWithEstablishment[]> {
    const now = getSingaporeTime();
    const currentDay = now.getDay(); // 0-6, where 0 is Sunday
    
    const activeDeals = Array.from(this.deals.values())
      .filter(deal => {
        const establishment = this.establishments.get(deal.establishmentId);
        if (!establishment) return false;
        
        // Check if deal is active now
        const isActive = deal.startTime <= now && deal.endTime >= now;
        
        // Check if deal is available on current day
        const daysOfWeek = deal.daysOfWeek as number[];
        const isCurrentDay = daysOfWeek.includes(currentDay);
        
        // Check if establishment is within radius
        const distance = this.calculateDistance(
          latitude, longitude,
          establishment.latitude, establishment.longitude
        );
        
        return isActive && isCurrentDay && distance <= radiusKm;
      })
      .map(deal => ({
        ...deal,
        establishment: this.establishments.get(deal.establishmentId)!
      }));
    
    return activeDeals;
  }

  async getUpcomingDeals(latitude: number, longitude: number, radiusKm: number): Promise<DealWithEstablishment[]> {
    const now = getSingaporeTime();
    const oneHourLater = new Date(now.getTime() + 3600000); // 1 hour later
    const currentDay = now.getDay(); // 0-6, where 0 is Sunday
    
    const upcomingDeals = Array.from(this.deals.values())
      .filter(deal => {
        const establishment = this.establishments.get(deal.establishmentId);
        if (!establishment) return false;
        
        // Check if deal starts within the next hour
        const isUpcoming = deal.startTime > now && deal.startTime <= oneHourLater;
        
        // Check if deal is available on current day
        const daysOfWeek = deal.daysOfWeek as number[];
        const isCurrentDay = daysOfWeek.includes(currentDay);
        
        // Check if establishment is within radius
        const distance = this.calculateDistance(
          latitude, longitude,
          establishment.latitude, establishment.longitude
        );
        
        return isUpcoming && isCurrentDay && distance <= radiusKm;
      })
      .map(deal => ({
        ...deal,
        establishment: this.establishments.get(deal.establishmentId)!
      }));
    
    return upcomingDeals;
  }

  async getFutureDeals(latitude: number, longitude: number, radiusKm: number): Promise<DealWithEstablishment[]> {
    const now = getSingaporeTime();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    const tomorrowDay = tomorrow.getDay(); // 0-6, where 0 is Sunday
    
    const futureDeals = Array.from(this.deals.values())
      .filter(deal => {
        const establishment = this.establishments.get(deal.establishmentId);
        if (!establishment) return false;
        
        // Logic for future deals would go here
        // This is simplified for in-memory implementation
        return true;
      })
      .map(deal => ({
        ...deal,
        establishment: this.establishments.get(deal.establishmentId)!
      }));
    
    return futureDeals;
  }
  
  /**
   * Get all active deals for a specific establishment
   * This method is used in the deal-to-restaurant workflow
   */
  /**
   * Helper method to check if a deal is currently active
   * Based on the current time and day
   */
  isDealActiveNow(deal: Deal): boolean {
    try {
      // Get current Singapore time for day/time validation
      const singaporeTime = getSingaporeTime();
      const currentDay = singaporeTime.getDay(); // 0-6, where 0 is Sunday
      const currentTime = singaporeTime.toTimeString().substring(0, 5); // Format: "HH:MM"
      // Convert current time to a numeric value for easier comparison (e.g., "13:45" -> 1345)
      const currentTimeValue = parseInt(currentTime.replace(':', ''));
      
      // Get the current day of the week in the format used in the valid_days field
      const dayMap: Record<number, string> = {
        0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
      };
      const currentDayStr = dayMap[currentDay].toLowerCase();
      
      // Check if today is a weekday (for "Weekdays" deals)
      const isWeekday = currentDay >= 1 && currentDay <= 5; // Monday to Friday
      
      // Check if the deal is valid for today's day of the week
      const validDays = deal.valid_days.toLowerCase();
      const isValidDay = validDays.includes('all days') || 
                         validDays.includes(currentDayStr) || 
                         (validDays.includes('weekdays') && isWeekday) ||
                         validDays.includes('everyday');
      
      if (!isValidDay) {
        return false;
      }
      
      // Convert happy hour start and end times to numeric values for comparison
      const startTime = deal.hh_start_time;
      const endTime = deal.hh_end_time;
      const startTimeValue = parseInt(startTime.replace(':', ''));
      const endTimeValue = parseInt(endTime.replace(':', ''));
      
      // Check if the deal is active at the current time
      if (startTimeValue <= endTimeValue) {
        // Normal case: start time is before end time (e.g., 12:00 - 14:00)
        return currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
      } else {
        // Special case: happy hour spans midnight (e.g., 22:00 - 02:00)
        return currentTimeValue >= startTimeValue || currentTimeValue <= endTimeValue;
      }
    } catch (error) {
      console.error("Error checking if deal is active:", error);
      return false;
    }
  }
  
  /**
   * Get all deals for a specific establishment
   * This returns ALL deals, not just active ones
   */
  async getDealsForEstablishment(establishmentId: number): Promise<Deal[]> {
    try {
      return Array.from(this.deals.values())
        .filter(deal => deal.establishmentId === establishmentId)
        .sort((a, b) => {
          // Sort by alcohol category first
          const catComp = a.alcohol_category.localeCompare(b.alcohol_category);
          if (catComp !== 0) return catComp;
          
          // Then sort by price
          return a.happy_hour_price - b.happy_hour_price;
        });
    } catch (error) {
      console.error("Error fetching deals for establishment:", error);
      return [];
    }
  }
  
  async getActiveDealsForEstablishment(establishmentId: number): Promise<Deal[]> {
    try {
      // Return all deals for the establishment without filtering by time
      // This is a simplified version that avoids potential issues
      return Array.from(this.deals.values())
        .filter(deal => deal.establishmentId === establishmentId)
        .sort((a, b) => {
          // Sort by alcohol category first
          const catComp = a.alcohol_category.localeCompare(b.alcohol_category);
          if (catComp !== 0) return catComp;
          
          // Then by price
          return a.happy_hour_price - b.happy_hour_price;
        });
    } catch (error) {
      console.error("Error fetching deals for establishment (MemStorage):", error);
      return [];
    }
  }
  
  // Helper method to check if a time is within happy hour range
  private isTimeWithinHappyHour(currentTime: string, startTime: string, endTime: string): boolean {
    // Normal case: start time is before end time (e.g., 17:00 - 19:00)
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    }
    
    // Special case: happy hour spans midnight (e.g., 22:00 - 02:00)
    return currentTime >= startTime || currentTime <= endTime;
  }

  async getFutureDeals(latitude: number, longitude: number, radiusKm: number): Promise<DealWithEstablishment[]> {
    const now = getSingaporeTime();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    const tomorrowDay = tomorrow.getDay(); // 0-6, where 0 is Sunday
    
    const futureDeals = Array.from(this.deals.values())
      .filter(deal => {
        const establishment = this.establishments.get(deal.establishmentId);
        if (!establishment) return false;
        
        // Check if deal is tomorrow
        const isTomorrow = deal.startTime >= tomorrow && deal.startTime < dayAfterTomorrow;
        
        // Check if deal is available on tomorrow's day
        const daysOfWeek = deal.daysOfWeek as number[];
        const isTomorrowDay = daysOfWeek.includes(tomorrowDay);
        
        // Check if establishment is within radius
        const distance = this.calculateDistance(
          latitude, longitude,
          establishment.latitude, establishment.longitude
        );
        
        return isTomorrow && isTomorrowDay && distance <= radiusKm;
      })
      .map(deal => ({
        ...deal,
        establishment: this.establishments.get(deal.establishmentId)!
      }));
    
    return futureDeals;
  }

  async searchDeals(query: string, filters: { type?: string, status?: string }): Promise<DealWithEstablishment[]> {
    const queryLower = query ? query.toLowerCase() : '';
    
    const matchingDeals = Array.from(this.deals.values())
      .filter(deal => {
        const establishment = this.establishments.get(deal.establishmentId);
        if (!establishment) return false;
        
        // Check type filter
        if (filters.type && deal.type !== filters.type) {
          return false;
        }
        
        // Check status filter
        if (filters.status && deal.status !== filters.status) {
          return false;
        }
        
        // If no query, consider it a match
        if (!queryLower) return true;
        
        // Search in deal fields
        const dealMatches = 
          deal.title.toLowerCase().includes(queryLower) ||
          deal.description.toLowerCase().includes(queryLower);
        
        // Search in establishment fields
        const establishmentMatches = 
          establishment.name.toLowerCase().includes(queryLower) ||
          establishment.address.toLowerCase().includes(queryLower) ||
          establishment.city.toLowerCase().includes(queryLower) ||
          establishment.postalCode.toLowerCase().includes(queryLower);
        
        return dealMatches || establishmentMatches;
      })
      .map(deal => ({
        ...deal,
        establishment: this.establishments.get(deal.establishmentId)!
      }));
    
    return matchingDeals;
  }

  // Review methods
  async getReviewsForDeal(dealId: number): Promise<Review[]> {
    return this.reviews.get(dealId) || [];
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const now = getSingaporeTime();
    
    const newReview: Review = {
      ...review,
      id,
      createdAt: now
    };
    
    // Add to reviews map
    const dealReviews = this.reviews.get(review.dealId) || [];
    dealReviews.push(newReview);
    this.reviews.set(review.dealId, dealReviews);
    
    return newReview;
  }

  // Saved Deals methods
  async getSavedDealsForUser(userId: number): Promise<DealWithEstablishment[]> {
    const userSavedDeals = this.savedDeals.get(userId) || [];
    
    return userSavedDeals.map(savedDeal => {
      const deal = this.deals.get(savedDeal.dealId)!;
      const establishment = this.establishments.get(deal.establishmentId)!;
      return {
        ...deal,
        establishment
      };
    });
  }

  async saveDeal(data: InsertSavedDeal): Promise<SavedDeal> {
    const userSavedDeals = this.savedDeals.get(data.userId) || [];
    
    // Check if already saved
    const existingSaved = userSavedDeals.find(saved => saved.dealId === data.dealId);
    if (existingSaved) {
      return existingSaved;
    }
    
    const id = this.savedDealIdCounter++;
    const now = getSingaporeTime();
    
    const newSavedDeal: SavedDeal = {
      ...data,
      id,
      createdAt: now
    };
    
    userSavedDeals.push(newSavedDeal);
    this.savedDeals.set(data.userId, userSavedDeals);
    
    return newSavedDeal;
  }

  async unsaveDeal(userId: number, dealId: number): Promise<void> {
    const userSavedDeals = this.savedDeals.get(userId) || [];
    
    const updatedSavedDeals = userSavedDeals.filter(
      saved => saved.dealId !== dealId
    );
    
    this.savedDeals.set(userId, updatedSavedDeals);
  }

  // User Deal Views methods
  async recordDealView(data: InsertUserDealView): Promise<UserDealView> {
    const id = this.userDealViewIdCounter++;
    const now = getSingaporeTime();
    
    const newDealView: UserDealView = {
      ...data,
      id,
      timestamp: now
    };
    
    // Add to user's deal views
    const userViews = this.userDealViews.get(data.userId) || [];
    userViews.push(newDealView);
    this.userDealViews.set(data.userId, userViews);
    
    // Increment user's deal view count
    await this.incrementUserDealViews(data.userId);
    
    return newDealView;
  }

  async getUserDealViews(userId: number): Promise<UserDealView[]> {
    return this.userDealViews.get(userId) || [];
  }

  async getUserSavings(userId: number): Promise<number> {
    const userViews = this.userDealViews.get(userId) || [];
    
    // Get unique deal IDs from views
    const uniqueDealIds = Array.from(
      new Set(userViews.map(view => view.dealId))
    );
    
    // Calculate savings
    let totalSavings = 0;
    
    for (const dealId of uniqueDealIds) {
      const deal = this.deals.get(dealId);
      if (deal) {
        totalSavings += (deal.regularPrice - deal.dealPrice);
      }
    }
    
    return totalSavings;
  }

  // Helper method for calculating distance between two coordinates
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371; // Earth radius in kilometers
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }
  
  private degToRad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

// Use DatabaseStorage if DATABASE_URL is provided, otherwise use MemStorage
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
