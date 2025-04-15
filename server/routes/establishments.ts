import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

/**
 * Get all establishments (restaurants, bars, etc.)
 */
router.get("/", async (req, res) => {
  try {
    const establishments = await storage.getAllEstablishments();
    res.json(establishments);
  } catch (error) {
    console.error("Error fetching establishments:", error);
    res.status(500).json({ error: "Failed to fetch establishments" });
  }
});

/**
 * Get nearby establishments with optional radius parameter
 */
router.get("/nearby", async (req, res) => {
  try {
    const querySchema = z.object({
      latitude: z.coerce.number(),
      longitude: z.coerce.number(),
      radius: z.coerce.number().default(1), // Default radius is 1km
    });

    const result = querySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid query parameters",
        details: result.error.format() 
      });
    }

    const { latitude, longitude, radius } = result.data;
    
    const establishments = await storage.getEstablishmentsNearby(
      latitude,
      longitude,
      radius
    );
    
    res.json(establishments);
  } catch (error) {
    console.error("Error fetching nearby establishments:", error);
    res.status(500).json({ error: "Failed to fetch nearby establishments" });
  }
});

/**
 * Get a specific establishment by ID along with its active deals
 * This is the key endpoint for the deal-to-restaurant workflow
 */
router.get("/:id", async (req, res) => {
  try {
    const establishmentId = parseInt(req.params.id);
    if (isNaN(establishmentId)) {
      return res.status(400).json({ error: "Invalid establishment ID" });
    }
    
    // Get the establishment details
    const establishment = await storage.getEstablishment(establishmentId);
    if (!establishment) {
      return res.status(404).json({ error: "Establishment not found" });
    }
    
    // Get all active deals for this establishment
    // We'll implement this method in the storage class
    const activeDeals = await storage.getActiveDealsForEstablishment(establishmentId);
    
    // Return combined response with establishment details and its active deals
    res.json({
      ...establishment,
      activeDeals
    });
  } catch (error) {
    console.error("Error fetching establishment details:", error);
    res.status(500).json({ error: "Failed to fetch establishment details" });
  }
});

export default router;