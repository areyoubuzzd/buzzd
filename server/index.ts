import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { checkConnection as checkCloudflareConnection } from "./services/cloudflare-images";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Explicitly serve images from the public/images directory
const imagePath = path.join(process.cwd(), 'public/images');
console.log('Serving static images from:', imagePath);
app.use('/images', express.static(imagePath));

// Explicit route for drink images 
const drinkImagesPath = path.join(process.cwd(), 'public/images/drinks');
console.log('Serving drink images from:', drinkImagesPath);
app.use('/images/drinks', express.static(drinkImagesPath));

// Also add a special route for debugging image existence
app.get('/debug/images/:category/:id', (req, res) => {
  const filePath = path.join(process.cwd(), 'public/images/drinks', req.params.category, req.params.id);
  const exists = fs.existsSync(filePath);
  
  res.json({
    requested: `/images/drinks/${req.params.category}/${req.params.id}`,
    exists,
    fullPath: filePath
  });
});

// Add direct file serving for debugging
app.get('/direct-image/:category/:id', (req, res) => {
  const { category, id } = req.params;
  const filePath = path.join(process.cwd(), 'public/images/drinks', category, id);
  
  if (fs.existsSync(filePath)) {
    // Determine content type based on file extension
    const ext = path.extname(id).toLowerCase();
    let contentType = 'image/jpeg'; // Default
    
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    
    res.setHeader('Content-Type', contentType);
    
    // Stream the file directly to the response
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).send('Image not found');
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Check Cloudflare Images connection
  try {
    const cloudflareStatus = await checkCloudflareConnection();
    if (cloudflareStatus.success) {
      console.log('✅ Successfully connected to Cloudflare Images API');
    } else {
      console.warn(`⚠️ ${cloudflareStatus.message}`);
    }
  } catch (error) {
    console.error('❌ Error checking Cloudflare Images connection:', error);
  }

  // Register API routes with explicit content-type
  // First regular API routes
  app.use('/api/deals', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  }, (await import('./routes/deals')).default);
  
  app.use('/api/establishments', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  }, (await import('./routes/establishments')).default);
  
  // Register the locations API routes
  app.use('/api/locations', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  }, (await import('./routes/locations')).default);
  
  // Also register V2 API routes 
  app.use('/api/v2/deals', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  }, (await import('./routes/deals')).default);
  
  app.use('/api/v2/establishments', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  }, (await import('./routes/establishments')).default);
  
  // Register image generation routes
  app.use('/api/image-generation', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  }, (await import('./routes/imageGenerationRoutes')).default);
  
  // Register collections routes
  app.use('/api/collections', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  }, (await import('./routes/collections')).default);
  
  // Register Cloudinary image routes
  app.use('/', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  }, (await import('./routes/cloudinaryRoutes')).default);
  
  // Register Cloudflare Images routes
  app.use('/', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  }, (await import('./routes/cloudflare-images')).default);
  
  // Register rest of the routes
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
