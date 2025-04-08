import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertDealSchema, insertEstablishmentSchema, insertReviewSchema, insertSavedDealSchema, insertUserDealViewSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { googleSheetsService } from "./services/googleSheetsService";
import { cloudinaryService } from "./services/cloudinaryService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Error handler for Zod validation errors
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  };

  // Authentication check middleware
  const requireAuth = (req: Request, res: Response, next: () => void) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // Premium tier check middleware
  const requirePremium = (req: Request, res: Response, next: () => void) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.subscriptionTier !== 'premium') {
      return res.status(403).json({ message: "Premium subscription required" });
    }
    next();
  };

  // Admin role check middleware
  const requireAdmin = (req: Request, res: Response, next: () => void) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    next();
  };

  // Restaurant role check middleware
  const requireRestaurant = (req: Request, res: Response, next: () => void) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.role !== 'restaurant' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Restaurant privileges required" });
    }
    next();
  };

  // Get user profile
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send the password hash to the client
      const { password, ...userWithoutPassword } = user;
      
      // Get user savings
      const savings = await storage.getUserSavings(user.id);
      
      res.json({
        ...userWithoutPassword,
        savings
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Deal Routes
  
  // Get deals near location
  app.get("/api/deals/nearby", async (req, res) => {
    try {
      const latitude = parseFloat(req.query.lat as string);
      const longitude = parseFloat(req.query.lng as string);
      const radius = parseFloat(req.query.radius as string) || 1; // Default 1km
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      
      const activeDeals = await storage.getActiveDeals(latitude, longitude, radius);
      const upcomingDeals = await storage.getUpcomingDeals(latitude, longitude, radius);
      const futureDeals = await storage.getFutureDeals(latitude, longitude, radius);
      
      // For free users, limit the number of deals returned
      if (req.isAuthenticated() && req.user.subscriptionTier === 'free') {
        const dealsViewed = req.user.dealsViewed;
        const maxFreeDeals = 3;
        const remainingDeals = Math.max(0, maxFreeDeals - dealsViewed);
        
        const limitedActiveDeals = activeDeals.slice(0, remainingDeals);
        
        return res.json({
          active: limitedActiveDeals,
          upcoming: upcomingDeals,
          future: futureDeals,
          subscription: {
            tier: 'free',
            viewed: dealsViewed,
            limit: maxFreeDeals,
            remaining: remainingDeals
          }
        });
      }
      
      // For premium users or non-authenticated users (who will see the upgrade prompt)
      res.json({
        active: activeDeals,
        upcoming: upcomingDeals,
        future: futureDeals,
        subscription: req.isAuthenticated() 
          ? { tier: req.user.subscriptionTier }
          : { tier: 'free', viewed: 0, limit: 3, remaining: 3 }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get deal details
  app.get("/api/deals/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const deal = await storage.getDealDetails(dealId);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // If authenticated, record the deal view
      if (req.isAuthenticated()) {
        try {
          await storage.recordDealView({
            userId: req.user.id,
            dealId: dealId
          });
        } catch (error) {
          console.error("Error recording deal view:", error);
        }
      }
      
      res.json(deal);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Search deals
  app.get("/api/deals/search", async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const filters = {
        type: req.query.type as string | undefined,
        status: req.query.status as string | undefined
      };
      
      const deals = await storage.searchDeals(query, filters);
      
      res.json(deals);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new deal (restaurant or admin only)
  app.post("/api/deals", requireRestaurant, async (req, res) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      const newDeal = await storage.createDeal(dealData);
      res.status(201).json(newDeal);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Update a deal (restaurant or admin only)
  app.put("/api/deals/:id", requireRestaurant, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const dealData = req.body;
      const updatedDeal = await storage.updateDeal(dealId, dealData);
      res.json(updatedDeal);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Establishment Routes
  
  // Get an establishment
  app.get("/api/establishments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid establishment ID" });
      }
      
      const establishment = await storage.getEstablishment(id);
      if (!establishment) {
        return res.status(404).json({ message: "Establishment not found" });
      }
      
      res.json(establishment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new establishment (admin only)
  app.post("/api/establishments", requireAdmin, async (req, res) => {
    try {
      const establishmentData = insertEstablishmentSchema.parse(req.body);
      const newEstablishment = await storage.createEstablishment(establishmentData);
      res.status(201).json(newEstablishment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Update an establishment (admin only)
  app.put("/api/establishments/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid establishment ID" });
      }
      
      const establishmentData = req.body;
      const updatedEstablishment = await storage.updateEstablishment(id, establishmentData);
      res.json(updatedEstablishment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Review Routes
  
  // Add a review for a deal
  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const newReview = await storage.createReview(reviewData);
      res.status(201).json(newReview);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Get reviews for a deal
  app.get("/api/deals/:id/reviews", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      const reviews = await storage.getReviewsForDeal(dealId);
      res.json(reviews);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Saved Deals Routes
  
  // Get user's saved deals
  app.get("/api/saved-deals", requireAuth, async (req, res) => {
    try {
      const savedDeals = await storage.getSavedDealsForUser(req.user.id);
      res.json(savedDeals);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Save a deal
  app.post("/api/saved-deals", requireAuth, async (req, res) => {
    try {
      const savedDealData = insertSavedDealSchema.parse({
        userId: req.user.id,
        dealId: req.body.dealId
      });
      
      const savedDeal = await storage.saveDeal(savedDealData);
      res.status(201).json(savedDeal);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Unsave a deal
  app.delete("/api/saved-deals/:dealId", requireAuth, async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      await storage.unsaveDeal(req.user.id, dealId);
      res.sendStatus(204);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User Savings
  app.get("/api/user/savings", requireAuth, async (req, res) => {
    try {
      const savings = await storage.getUserSavings(req.user.id);
      res.json({ savings });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Deal Views
  app.post("/api/deals/:id/view", requireAuth, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }
      
      // Record the deal view
      const dealViewData = insertUserDealViewSchema.parse({
        userId: req.user.id,
        dealId: dealId
      });
      
      await storage.recordDealView(dealViewData);
      res.sendStatus(204);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // ======================================
  // Google Sheets API Integration
  // ======================================
  
  // Get all restaurants from Google Sheets
  app.get("/api/sheets/restaurants", async (req, res) => {
    try {
      const restaurants = await googleSheetsService.getRestaurants();
      
      // Map through restaurants and add Cloudinary logo URLs
      const enhancedRestaurants = restaurants.map(restaurant => ({
        ...restaurant,
        logoUrl: restaurant.logoUrl || cloudinaryService.getRestaurantLogoUrl(restaurant.restaurantId)
      }));
      
      res.json(enhancedRestaurants);
    } catch (error) {
      console.error("Error fetching restaurants from Google Sheets:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });
  
  // Get all deals from Google Sheets
  app.get("/api/sheets/deals", async (req, res) => {
    try {
      const deals = await googleSheetsService.getDeals();
      
      // Enhance deals with Cloudinary image URLs
      const enhancedDeals = deals.map(deal => ({
        ...deal,
        bgImageUrl: deal.customBgImageUrl || 
          cloudinaryService.getBackgroundImageUrl(deal.alcoholCategory, deal.alcoholSubCategory),
        brandImageUrl: deal.customBrandImageUrl || 
          cloudinaryService.getBrandImageUrl(deal.alcoholCategory, deal.brandName)
      }));
      
      res.json(enhancedDeals);
    } catch (error) {
      console.error("Error fetching deals from Google Sheets:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });
  
  // Get active deals from Google Sheets
  app.get("/api/sheets/deals/active", async (req, res) => {
    try {
      const activeDeals = await googleSheetsService.getActiveDeals();
      
      // Enhance deals with Cloudinary image URLs
      const enhancedDeals = activeDeals.map(deal => ({
        ...deal,
        bgImageUrl: deal.customBgImageUrl || 
          cloudinaryService.getBackgroundImageUrl(deal.alcoholCategory, deal.alcoholSubCategory),
        brandImageUrl: deal.customBrandImageUrl || 
          cloudinaryService.getBrandImageUrl(deal.alcoholCategory, deal.brandName)
      }));
      
      res.json(enhancedDeals);
    } catch (error) {
      console.error("Error fetching active deals from Google Sheets:", error);
      res.status(500).json({ message: "Failed to fetch active deals" });
    }
  });
  
  // Get deals for a specific restaurant
  app.get("/api/sheets/restaurants/:id/deals", async (req, res) => {
    try {
      const restaurantId = req.params.id;
      const deals = await googleSheetsService.getDealsByRestaurantId(restaurantId);
      
      // Enhance deals with Cloudinary image URLs
      const enhancedDeals = deals.map(deal => ({
        ...deal,
        bgImageUrl: deal.customBgImageUrl || 
          cloudinaryService.getBackgroundImageUrl(deal.alcoholCategory, deal.alcoholSubCategory),
        brandImageUrl: deal.customBrandImageUrl || 
          cloudinaryService.getBrandImageUrl(deal.alcoholCategory, deal.brandName)
      }));
      
      res.json(enhancedDeals);
    } catch (error) {
      console.error(`Error fetching deals for restaurant ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch restaurant deals" });
    }
  });
  
  // Get deals near a location (from Google Sheets)
  // Test endpoint for Google Sheets connection
  app.get("/api/check-sheet-content", async (req, res) => {
    try {
      // Get the content of Sheet1
      const response = await googleSheetsService.sheets.spreadsheets.values.get({
        spreadsheetId: googleSheetsService.spreadsheetId,
        range: 'Sheet1!A1:Z10', // Get the first 10 rows
      });
      
      // Return the raw data
      res.json({
        success: true,
        headers: response.data.values?.[0] || [],
        data: response.data.values?.slice(1, 10) || []
      });
    } catch (error) {
      console.error("Error getting sheet content:", error);
      res.status(500).json({ 
        success: false, 
        error: String(error)
      });
    }
  });

  app.get("/api/test-restaurants", async (req, res) => {
    try {
      // Get restaurants with our updated mapping
      const restaurants = await googleSheetsService.getRestaurants();
      
      res.json({
        success: true,
        count: restaurants.length,
        restaurants: restaurants
      });
    } catch (error) {
      console.error("Error testing restaurant data:", error);
      res.status(500).json({ 
        success: false, 
        error: String(error)
      });
    }
  });

  app.get("/api/test-google-sheets", async (req, res) => {
    try {
      // First get metadata about the spreadsheet
      const metadata = await googleSheetsService.sheets.spreadsheets.get({
        spreadsheetId: googleSheetsService.spreadsheetId
      });
      
      const sheetNames = metadata.data.sheets.map((s: any) => s.properties.title);
      
      // Look specifically for a sheet named Restaurant or similar
      const restaurantSheet = metadata.data.sheets.find((s: any) => 
        s.properties.title.toLowerCase().includes('restaurant')
      );
      
      let restaurants = [];
      let sheetData = {};
      
      // If we found a restaurant sheet, try to get data from it
      if (restaurantSheet) {
        const sheetName = restaurantSheet.properties.title;
        const response = await googleSheetsService.sheets.spreadsheets.values.get({
          spreadsheetId: googleSheetsService.spreadsheetId,
          range: `${sheetName}!A1:Z`,
        });
        
        if (response.data.values && response.data.values.length > 0) {
          // Get header row to see column names
          const headers = response.data.values[0];
          const nameColumnIndex = headers.findIndex((h: string) => 
            h.toLowerCase().includes('name') || h.toLowerCase().includes('restaurant')
          );
          
          // If we found a name column, get some examples
          if (nameColumnIndex >= 0) {
            const examples = response.data.values
              .slice(1, 6) // Get rows 2-6
              .map((row: string[]) => row[nameColumnIndex])
              .filter(Boolean); // Remove empty values
              
            sheetData = {
              sheetName,
              headers,
              nameColumnIndex,
              examples
            };
          }
        }
      }
      
      res.json({ 
        success: true,
        sheetNames,
        restaurantSheetFound: !!restaurantSheet,
        sheetData
      });
    } catch (error) {
      console.error("Error testing Google Sheets:", error);
      res.status(500).json({ 
        success: false, 
        error: String(error),
        message: "Failed to connect to Google Sheets" 
      });
    }
  });

  app.get("/api/sheets/deals/nearby", async (req, res) => {
    try {
      const latitude = parseFloat(req.query.lat as string);
      const longitude = parseFloat(req.query.lng as string);
      const radius = parseFloat(req.query.radius as string) || 1; // Default 1km
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      
      // Get all restaurants and deals
      const restaurants = await googleSheetsService.getRestaurants();
      const deals = await googleSheetsService.getDeals();
      
      // Create a map of restaurants by ID for faster lookups
      const restaurantMap = restaurants.reduce((map, restaurant) => {
        map[restaurant.restaurantId] = restaurant;
        return map;
      }, {} as Record<string, typeof restaurants[0]>);
      
      // Filter restaurants based on location
      const nearbyRestaurants = restaurants.filter(restaurant => {
        const distance = calculateDistance(
          latitude, longitude,
          restaurant.latitude, restaurant.longitude
        );
        return distance <= radius;
      });
      
      // Get restaurant IDs of nearby restaurants
      const nearbyRestaurantIds = nearbyRestaurants.map(r => r.restaurantId);
      
      // Filter deals based on restaurant location and status
      const nearbyDeals = deals.filter(deal => 
        nearbyRestaurantIds.includes(deal.restaurantId)
      );
      
      // Group deals by status
      const activeDeals = nearbyDeals.filter(deal => deal.dealStatus === 'active');
      const upcomingDeals = nearbyDeals.filter(deal => deal.dealStatus === 'upcoming');
      
      // Enhance deals with restaurant info and images
      const enhanceDealsWithInfo = (dealList: typeof deals) => 
        dealList.map(deal => {
          const restaurant = restaurantMap[deal.restaurantId];
          const distance = calculateDistance(
            latitude, longitude,
            restaurant.latitude, restaurant.longitude
          );
          
          return {
            ...deal,
            restaurant: {
              ...restaurant,
              logoUrl: restaurant.logoUrl || cloudinaryService.getRestaurantLogoUrl(restaurant.restaurantId)
            },
            distance,
            bgImageUrl: deal.customBgImageUrl || 
              cloudinaryService.getBackgroundImageUrl(deal.alcoholCategory, deal.alcoholSubCategory),
            brandImageUrl: deal.customBrandImageUrl || 
              cloudinaryService.getBrandImageUrl(deal.alcoholCategory, deal.brandName)
          };
        });
      
      // Sort deals by restaurant priority (higher first) and then by distance
      const sortDealsByPriorityAndDistance = (deals: ReturnType<typeof enhanceDealsWithInfo>) => 
        deals.sort((a, b) => {
          // First sort by priority (higher first)
          if (b.restaurant.priority !== a.restaurant.priority) {
            return b.restaurant.priority - a.restaurant.priority;
          }
          // Then sort by distance (closer first)
          return a.distance - b.distance;
        });
      
      const enhancedActiveDeals = sortDealsByPriorityAndDistance(enhanceDealsWithInfo(activeDeals));
      const enhancedUpcomingDeals = sortDealsByPriorityAndDistance(enhanceDealsWithInfo(upcomingDeals));
      
      // For free users, limit the number of deals returned (similar to the existing endpoint)
      if (req.isAuthenticated() && req.user.subscriptionTier === 'free') {
        const dealsViewed = req.user.dealsViewed || 0;
        const maxFreeDeals = 3;
        const remainingDeals = Math.max(0, maxFreeDeals - dealsViewed);
        
        const limitedActiveDeals = enhancedActiveDeals.slice(0, remainingDeals);
        
        return res.json({
          active: limitedActiveDeals,
          upcoming: enhancedUpcomingDeals,
          subscription: {
            tier: 'free',
            viewed: dealsViewed,
            limit: maxFreeDeals,
            remaining: remainingDeals
          }
        });
      }
      
      // For premium users or non-authenticated users
      res.json({
        active: enhancedActiveDeals,
        upcoming: enhancedUpcomingDeals,
        subscription: req.isAuthenticated() 
          ? { tier: req.user.subscriptionTier }
          : { tier: 'free', viewed: 0, limit: 3, remaining: 3 }
      });
    } catch (error) {
      console.error("Error fetching nearby deals from Google Sheets:", error);
      res.status(500).json({ message: "Failed to fetch nearby deals" });
    }
  });
  
  // Helper function to calculate distance between two points using Haversine formula
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  }
  
  function deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  const httpServer = createServer(app);
  return httpServer;
}
