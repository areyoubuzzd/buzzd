import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import { checkConnection as checkCloudflareConnection } from "./services/cloudflare-images";
import path from "path";
import fs from "fs";
import sharp from "sharp";

// Initialize API for deployment - this is the key function that will be imported
// by our deployment script
export default async function initServer(app: express.Express): Promise<void> {
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

  // Add direct file serving with resize support
  app.get('/direct-image/:category/:id', async (req, res) => {
    const { category, id } = req.params;
    const { width, height } = req.query;
    
    // Parse width and height if provided
    const parsedWidth = width ? parseInt(width as string, 10) : null;
    const parsedHeight = height ? parseInt(height as string, 10) : null;
    
    // Try to find the file with different extensions if it doesn't have one
    let filePath = path.join(process.cwd(), 'public/images/drinks', category, id);
    let fileExists = fs.existsSync(filePath);
    let ext = path.extname(id).toLowerCase();
    
    // If no extension in ID and file doesn't exist, try with common extensions
    if (!ext && !fileExists) {
      console.log('No extension in ID, trying to find file with extension...');
      const possibleExtensions = ['.jpeg', '.jpg', '.png', '.webp'];
      for (const extension of possibleExtensions) {
        const testPath = path.join(process.cwd(), 'public/images/drinks', category, `${id}${extension}`);
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          fileExists = true;
          ext = extension;
          console.log(`Found file with extension: ${extension}`);
          break;
        }
      }
    }
    
    if (fileExists) {
      try {
        // Determine content type based on file extension
        let contentType = 'image/jpeg'; // Default
        let outputFormat: keyof sharp.FormatEnum = 'jpeg'; // Default format for sharp
        
        if (ext === '.png') {
          contentType = 'image/png';
          outputFormat = 'png';
        } else if (ext === '.webp') {
          contentType = 'image/webp';
          outputFormat = 'webp';
        }
        
        res.setHeader('Content-Type', contentType);
        
        // If we need to resize the image
        if (parsedWidth || parsedHeight) {
          const image = sharp(filePath);
          
          // Get image info
          const metadata = await image.metadata();
          
          // Resize options
          const resizeOptions: sharp.ResizeOptions = {};
          if (parsedWidth) resizeOptions.width = parsedWidth;
          if (parsedHeight) resizeOptions.height = parsedHeight;
          if (!parsedHeight && !parsedWidth) {
            // Default size if both are missing but resize is requested
            resizeOptions.width = 300;
          }
          
          // Only resize if needed
          if (
            (resizeOptions.width && (!metadata.width || metadata.width > resizeOptions.width)) || 
            (resizeOptions.height && (!metadata.height || metadata.height > resizeOptions.height))
          ) {
            // Resize and output in the original format
            image
              .resize(resizeOptions)
              .toFormat(outputFormat, { quality: 80 })
              .pipe(res);
          } else {
            // No resize needed, just serve original
            fs.createReadStream(filePath).pipe(res);
          }
        } else {
          // No resize requested, serve original
          fs.createReadStream(filePath).pipe(res);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('Error processing image');
      }
    } else {
      console.log(`Image not found: ${filePath}`);
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
  
  // Register local images routes
  app.use('/', (req, res, next) => {
    // Don't set Content-Type for file uploads
    if (!req.url.includes('/upload')) {
      res.setHeader('Content-Type', 'application/json');
    }
    next();
  }, (await import('./routes/local-images')).default);
  
  // Register rest of the routes
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Error:', err);
  });

  // Serve static files in production
  serveStatic(app);
}

// This is for development mode only - when running directly
if (require.main === module) {
  (async () => {
    const app = express();
    await initServer(app);
    
    // Get port from environment variable or default to 5000
    const port = process.env.PORT || 5000;
    const server = app.listen({
      port: Number(port),
      host: "0.0.0.0", // Listen on all available network interfaces
    }, () => {
      console.log(`Server running on http://0.0.0.0:${port}`);
    });
  })();
}