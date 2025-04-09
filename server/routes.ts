import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertDealSchema, insertEstablishmentSchema, insertReviewSchema, insertSavedDealSchema, insertUserDealViewSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { syncAllDataFromSheets, syncEstablishmentsFromSheets, syncDealsFromSheets } from "./services/googleSheetsService";
import { cloudinaryService } from "./services/cloudinaryService";
import uploadDealImageRouter from "./routes/upload-deal-image";
import menuAnalysisRoutes from "./routes/menuAnalysisRoutes_new.js";
import { db, pool } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Register the deal image upload route
  app.use(uploadDealImageRouter);
  
  // Register menu analysis routes
  app.use('/api/menu-analysis', menuAnalysisRoutes);
  
  // Test endpoint for Cloudinary image URLs
  app.get("/api/test-cloudinary", async (_req, res) => {
    try {
      const { testCloudinaryConnection, logCloudinaryConfig, generateTestUrls } = await import('./test-cloudinary');
      
      // Log Cloudinary config to help debug
      logCloudinaryConfig();
      
      // Test connection
      let connectionOk = false;
      try {
        connectionOk = await testCloudinaryConnection();
      } catch (error) {
        console.error("Cloudinary connection test failed:", error);
      }
      
      // Generate URLs using the Cloudinary SDK
      const testUrlsData = generateTestUrls();
      
      // Use the configured Cloudinary account, with fallback to demo
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "demo";
      const hardcodedUrls = testUrlsData.hardcodedUrls;
      
      res.json({ 
        connectionOk,
        sdkUrls: testUrlsData,
        hardcodedUrls,
        cloudName
      });
    } catch (error) {
      console.error("Error in Cloudinary test endpoint:", error);
      res.status(500).json({ error: "Failed to generate test URLs" });
    }
  });

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
  
  // Get all establishments
  app.get("/api/establishments", async (req, res) => {
    try {
      // Query all establishments from the database
      const { rows } = await pool.query(`
        SELECT id, name, external_id, address, city, postal_code, latitude, longitude, image_url 
        FROM establishments
        ORDER BY name ASC
      `);
      
      res.json(rows);
    } catch (error) {
      console.error("Error fetching establishments:", error);
      res.status(500).json({ message: "Failed to fetch establishments" });
    }
  });
  
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
  // Google Sheets API Integration for Database Sync
  // ======================================
  
  /* 
   * NOTE: The previous Google Sheets API endpoints have been replaced
   * with a new database sync functionality. To load data from Google Sheets
   * into the database, use the scripts:
   * 
   * ./db-sync.sh all        # Sync establishments and deals
   * ./db-sync.sh establishments # Sync only establishments 
   * ./db-sync.sh deals      # Sync only deals
   */
  
  // Database sync endpoints (Admin only)

  // Set up Cloudinary folder structure and register uploader routes
  try {
    // First try to set up the folder structure
    try {
      const setupCloudinaryFoldersModule = await import('./utils/setupCloudinaryFolders');
      const setupCloudinaryFolders = setupCloudinaryFoldersModule.default;
      console.log('Setting up Cloudinary folder structure...');
      await setupCloudinaryFolders();
    } catch (setupError) {
      console.error('Error setting up Cloudinary folders:', setupError);
      // Continue even if folder setup fails - the upload might still work
    }

    // Then register the routes
    const cloudinaryRoutesModule = await import('./routes/cloudinaryRoutes');
    app.use(cloudinaryRoutesModule.default);
    console.log('Cloudinary image uploader routes registered');
  } catch (error) {
    console.error('Error registering Cloudinary routes:', error);
  }

  // Database sync endpoints from Google Sheets
  app.post("/api/db/sync/all", requireAdmin, async (req, res) => {
    try {
      console.log('Starting full database sync from Google Sheets...');
      
      console.log('Syncing establishments...');
      const establishments = await syncEstablishmentsFromSheets();
      console.log(`Synced ${establishments.length} establishments`);
      
      console.log('Syncing deals...');
      const dealsResult = await syncDealsFromSheets();
      console.log(`Synced ${dealsResult.length} deals`);
      
      res.json({
        success: true,
        message: 'Successfully synced data from Google Sheets',
        establishments: establishments.length,
        deals: dealsResult.length
      });
    } catch (error) {
      console.error('Error during full sync:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync data from Google Sheets',
        error: (error as Error).message
      });
    }
  });
  
  app.post("/api/db/sync/establishments", requireAdmin, async (req, res) => {
    try {
      console.log('Syncing establishments from Google Sheets...');
      const establishments = await syncEstablishmentsFromSheets();
      console.log(`Synced ${establishments.length} establishments`);
      
      res.json({
        success: true,
        message: 'Successfully synced establishments from Google Sheets',
        count: establishments.length
      });
    } catch (error) {
      console.error('Error syncing establishments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync establishments from Google Sheets',
        error: (error as Error).message
      });
    }
  });
  
  app.post("/api/db/sync/deals", requireAdmin, async (req, res) => {
    try {
      console.log('Syncing deals from Google Sheets...');
      const deals = await syncDealsFromSheets();
      console.log(`Synced ${deals.length} deals`);
      
      res.json({
        success: true,
        message: 'Successfully synced deals from Google Sheets',
        count: deals.length
      });
    } catch (error) {
      console.error('Error syncing deals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync deals from Google Sheets',
        error: (error as Error).message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
