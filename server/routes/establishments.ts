import express from 'express';
import { storage } from '../storage';

const router = express.Router();

/**
 * Get all establishments (restaurants, bars, etc.) with their active deals
 */
router.get('/', async (req, res) => {
  try {
    const establishments = await storage.getAllEstablishments();
    
    // For each establishment, fetch its active deals
    const establishmentsWithDeals = await Promise.all(
      establishments.map(async (establishment) => {
        const activeDeals = await storage.getActiveDealsForEstablishment(establishment.id);
        return {
          ...establishment,
          activeDeals
        };
      })
    );
    
    res.json(establishmentsWithDeals);
  } catch (error) {
    console.error("Error fetching establishments:", error);
    res.status(500).json({ message: "Failed to fetch establishments" });
  }
});

/**
 * Get nearby establishments with optional radius parameter
 * Include active deals for each establishment
 */
router.get('/nearby', async (req, res) => {
  try {
    const latitude = parseFloat(req.query.lat as string);
    const longitude = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 1; // Default 1km
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }
    
    const establishments = await storage.getEstablishmentsNearby(latitude, longitude, radius);
    
    // For each establishment, fetch its active deals
    const establishmentsWithDeals = await Promise.all(
      establishments.map(async (establishment) => {
        const activeDeals = await storage.getActiveDealsForEstablishment(establishment.id);
        return {
          ...establishment,
          activeDeals
        };
      })
    );
    
    res.json(establishmentsWithDeals);
  } catch (error) {
    console.error("Error fetching nearby establishments:", error);
    res.status(500).json({ message: "Failed to fetch nearby establishments" });
  }
});

/**
 * Get a specific establishment by ID along with its active deals
 * This is the key endpoint for the deal-to-restaurant workflow
 */
router.get('/:id', async (req, res) => {
  try {
    const establishmentId = parseInt(req.params.id);
    if (isNaN(establishmentId)) {
      return res.status(400).json({ message: "Invalid establishment ID" });
    }
    
    const establishment = await storage.getEstablishment(establishmentId);
    if (!establishment) {
      return res.status(404).json({ message: "Establishment not found" });
    }
    
    // Get all deals for this establishment
    const allDeals = await storage.getActiveDealsForEstablishment(establishmentId);
    
    // We'll handle the sorting manually
    // First filter deals that are active today (using the isDealActiveNow method)
    // Because the getActiveDealsForEstablishment already contains this status
    // Filter out deals without isActive property
    const dealsWithStatus = allDeals.filter(deal => 'isActive' in deal);
    
    // Sort deals: active deals first, then inactive
    const sortedDeals = dealsWithStatus.sort((dealA, dealB) => {
      // Sort by active status first (active deals come first)
      const a = dealA as typeof dealA & { isActive: boolean };
      const b = dealB as typeof dealB & { isActive: boolean };
      
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      // If both have same active status, sort by price (cheaper first)
      return a.happy_hour_price - b.happy_hour_price;
    });
    
    res.json({
      establishment,
      activeDeals: sortedDeals
    });
  } catch (error) {
    console.error("Error fetching establishment details:", error);
    res.status(500).json({ message: "Failed to fetch establishment details" });
  }
});

export default router;