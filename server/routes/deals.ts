import express from 'express';
import { storage } from '../storage';

const router = express.Router();

/**
 * Get active deals for the nearest establishments
 * This endpoint is used for the main deals discovery screen
 * 
 * Query Parameters:
 * - lat: latitude of user location
 * - lng: longitude of user location
 * - radius: radius in kilometers (default: 1km)
 */
router.get('/nearby', async (req, res) => {
  try {
    const latitude = parseFloat(req.query.lat as string);
    const longitude = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 1; // Default 1km
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }
    
    const activeDeals = await storage.getActiveDeals(latitude, longitude, radius);
    const upcomingDeals = await storage.getUpcomingDeals(latitude, longitude, radius);
    
    res.json({
      active: activeDeals,
      upcoming: upcomingDeals
    });
  } catch (error) {
    console.error("Error fetching nearby deals:", error);
    res.status(500).json({ message: "Failed to fetch nearby deals" });
  }
});

/**
 * Get deal details with establishment info
 * This is the first step of the deal-to-restaurant workflow
 * When a user clicks on a deal card, they see full deal details
 */
router.get('/:id', async (req, res) => {
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
    if (req.isAuthenticated() && req.user) {
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
    console.error("Error fetching deal details:", error);
    res.status(500).json({ message: "Failed to fetch deal details" });
  }
});

export default router;