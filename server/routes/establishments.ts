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
    const allDeals = await storage.getDealsForEstablishment(establishmentId);
    
    // Determine which deals are active right now
    const dealsWithActiveStatus = allDeals.map(deal => {
      const isActive = storage.isDealActiveNow(deal);
      return {
        ...deal,
        isActive
      };
    });
    
    // Sort deals: active deals first, then inactive
    const sortedDeals = dealsWithActiveStatus.sort((a, b) => {
      // Sort by active status first (active deals come first)
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