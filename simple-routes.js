// Simplified routes without Cloudinary/Cloudflare for preview only
import { Express } from "express";
import { createServer } from "http";
import { storage } from "./server/storage";
import { setupAuth } from "./server/auth";
import dealsRoutes from "./server/routes/deals";
import establishmentsRoutes from "./server/routes/establishments";
import locationRoutes from "./server/routes/locationRoutes";
import locationSearchRoutes from "./server/routes/locationSearchRoutes";

export async function registerRoutes(app) {
  // Set up authentication routes
  setupAuth(app);
  
  // Skip cloudinary/cloudflare routes
  
  // Register location routes
  app.use('/api/locations', locationRoutes);
  
  // Register location search routes
  app.use('/api/locations', locationSearchRoutes);
  
  // Register deal routes
  app.use('/api/deals', dealsRoutes);
  
  // Register establishment routes
  app.use('/api/establishments', establishmentsRoutes);
  
  // Create and return the HTTP server
  return createServer(app);
}