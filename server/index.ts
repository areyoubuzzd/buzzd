import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
