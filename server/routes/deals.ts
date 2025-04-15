import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Schema for location-based queries
const locationQuerySchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  radius: z.coerce.number().default(1), // Default radius is 1km
});

/**
 * Get active deals (deals that are active at the current time)
 * Filtered by current time/day and sorted by distance
 */
router.get("/active", async (req, res) => {
  try {
    const result = locationQuerySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid query parameters",
        details: result.error.format() 
      });
    }

    const { latitude, longitude, radius } = result.data;
    
    // Get all active deals sorted by distance
    const activeDeals = await storage.getActiveDeals(latitude, longitude, radius);
    
    res.json(activeDeals);
  } catch (error) {
    console.error("Error fetching active deals:", error);
    res.status(500).json({ error: "Failed to fetch active deals" });
  }
});

/**
 * Get upcoming deals (deals that will be active later today or this week)
 */
router.get("/upcoming", async (req, res) => {
  try {
    const result = locationQuerySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid query parameters",
        details: result.error.format() 
      });
    }

    const { latitude, longitude, radius } = result.data;
    
    // Get upcoming deals sorted by distance
    const upcomingDeals = await storage.getUpcomingDeals(latitude, longitude, radius);
    
    res.json(upcomingDeals);
  } catch (error) {
    console.error("Error fetching upcoming deals:", error);
    res.status(500).json({ error: "Failed to fetch upcoming deals" });
  }
});

/**
 * Get future deals (deals active in the future, not today)
 */
router.get("/future", async (req, res) => {
  try {
    const result = locationQuerySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid query parameters",
        details: result.error.format() 
      });
    }

    const { latitude, longitude, radius } = result.data;
    
    // Get future deals sorted by distance
    const futureDeals = await storage.getFutureDeals(latitude, longitude, radius);
    
    res.json(futureDeals);
  } catch (error) {
    console.error("Error fetching future deals:", error);
    res.status(500).json({ error: "Failed to fetch future deals" });
  }
});

/**
 * Get detail about a specific deal
 */
router.get("/:id", async (req, res) => {
  try {
    const dealId = parseInt(req.params.id);
    if (isNaN(dealId)) {
      return res.status(400).json({ error: "Invalid deal ID" });
    }
    
    const deal = await storage.getDealDetails(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }
    
    res.json(deal);
  } catch (error) {
    console.error("Error fetching deal details:", error);
    res.status(500).json({ error: "Failed to fetch deal details" });
  }
});

/**
 * Search for deals with various filters
 */
router.get("/search", async (req, res) => {
  try {
    const querySchema = z.object({
      query: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
    });

    const result = querySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid query parameters",
        details: result.error.format() 
      });
    }

    const { query = "", type, status } = result.data;
    
    const searchResults = await storage.searchDeals(query, { type, status });
    
    res.json(searchResults);
  } catch (error) {
    console.error("Error searching for deals:", error);
    res.status(500).json({ error: "Failed to search for deals" });
  }
});

/**
 * Record a deal view
 */
router.post("/view/:id", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "You must be logged in to view deals" });
    }
    
    const dealId = parseInt(req.params.id);
    if (isNaN(dealId)) {
      return res.status(400).json({ error: "Invalid deal ID" });
    }
    
    // Record the view
    await storage.recordDealView({
      userId: req.user!.id,
      dealId,
    });
    
    // Increment the user's deal view count
    const updatedUser = await storage.incrementUserDealViews(req.user!.id);
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error recording deal view:", error);
    res.status(500).json({ error: "Failed to record deal view" });
  }
});

export default router;