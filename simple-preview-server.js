// simplified server for preview mode only - no Cloudinary
import express from 'express';
import { registerRoutes } from './simple-routes.js';
import { setupVite, serveStatic, log } from './server/vite';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Skip Cloudinary setup to avoid rate limits

// Setup routes
registerRoutes(app)
  .then(() => {
    // Setup Vite
    const PORT = process.env.PORT || 3000;
    return setupVite(app, { port: PORT });
  })
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      log(`Server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
  });