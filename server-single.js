/**
 * Unified Server for Buzzd App
 * This server handles both API routes and static file serving
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

console.log(`
=================================================
  BUZZD UNIFIED SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || "development"}
Node Version: ${process.version}
Current Directory: ${process.cwd()}
Port: ${PORT}
=================================================
`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve image directories
app.use("/images", express.static(path.join(process.cwd(), "public/images")));
app.use(
  "/images/drinks",
  express.static(path.join(process.cwd(), "public/images/drinks")),
);
["public", "public/assets", "assets"].forEach((dir) => {
  if (fs.existsSync(dir)) {
    app.use("/" + path.basename(dir), express.static(dir));
    console.log(`Serving additional assets from ${dir}`);
  }
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let pool;
try {
  const connectionString = process.env.DATABASE_URL;
  const maskedConnection = connectionString.includes("@")
    ? connectionString.split("@")[1].split("/")[0]
    : "masked-database-url";
  console.log(`🔌 Connecting to database: ${maskedConnection}`);
  pool = new Pool({ connectionString });
  console.log("✅ Database connection successful");
} catch (error) {
  console.error("❌ Failed to connect to database:", error);
  throw error;
}

process.env.DISABLE_CLOUDINARY =
  process.env.NODE_ENV === "production"
    ? "true"
    : process.env.DISABLE_CLOUDINARY;
process.env.DISABLE_CLOUDFLARE =
  process.env.NODE_ENV === "production"
    ? "true"
    : process.env.DISABLE_CLOUDFLARE;

async function setupRoutes() {
  try {
    console.log("Setting up core API routes...");

    const establishmentsModule = await import(
      "./server/routes/establishments.ts"
    );
    app.use("/api/establishments", establishmentsModule.default);
    app.use("/api/v2/establishments", establishmentsModule.default);

    const dealsModule = await import("./server/routes/deals.ts");
    app.use("/api/deals", dealsModule.default);
    app.use("/api/v2/deals", dealsModule.default);

    const collectionsModule = await import("./server/routes/collections.ts");
    app.use("/api/collections", collectionsModule.default);

    const locationsModule = await import("./server/routes/locations.ts");
    app.use("/api/locations", locationsModule.default);

    // ✅ Add this block to register user routes
    try {
      const userModule = await import("./server/routes/user.ts");
      app.use("/api/user", userModule.default);
      console.log("✅ User routes registered");
    } catch (err) {
      console.log("⚠️ User routes not available:", err.message);
    }

    console.log("✅ Core API routes registered successfully");

    try {
      const imageGenModule = await import(
        "./server/routes/imageGenerationRoutes.ts"
      );
      app.use("/api/image-generation", imageGenModule.default);
      console.log("✅ Image generation routes registered");
    } catch (err) {
      console.log("⚠️ Image generation routes not available:", err.message);
    }

    if (process.env.DISABLE_CLOUDINARY !== "true") {
      try {
        const cloudinaryModule = await import(
          "./server/routes/cloudinaryRoutes.js"
        );
        app.use("/", cloudinaryModule.default);
        console.log("✅ Cloudinary routes registered");
      } catch (err) {
        console.log("⚠️ Cloudinary routes not available:", err.message);
      }
    } else {
      console.log("ℹ️ Cloudinary routes disabled by environment variable");
      app.use("/api/cloudinary", (req, res) => {
        res.status(503).json({ error: "Cloudinary service disabled" });
      });
    }

    if (process.env.DISABLE_CLOUDFLARE !== "true") {
      try {
        const cloudflareModule = await import(
          "./server/routes/cloudflare-images.ts"
        );
        app.use("/", cloudflareModule.default);
        console.log("✅ Cloudflare routes registered");
      } catch (err) {
        console.log("⚠️ Cloudflare routes not available:", err.message);
      }
    } else {
      console.log("ℹ️ Cloudflare routes disabled by environment variable");
      app.use("/api/cloudflare", (req, res) => {
        res.status(503).json({ error: "Cloudflare service disabled" });
      });
    }

    try {
      const localImagesModule = await import("./server/routes/local-images.ts");
      app.use("/", localImagesModule.default);
      console.log("✅ Local image routes registered");
    } catch (err) {
      console.log("⚠️ Local image routes not available:", err.message);
    }

    console.log("✅ All API routes setup completed");
  } catch (error) {
    console.error("❌ Critical error setting up routes:", error);
    console.error("Continuing with limited functionality...");
  }
}

await setupRoutes();

const possibleClientPaths = [
  path.join(__dirname, "dist/public"),
  path.join(__dirname, "client/dist"),
  path.join(__dirname, "dist"),
  path.join(__dirname, "client"),
];

let clientPath = "";
for (const dirPath of possibleClientPaths) {
  if (fs.existsSync(path.join(dirPath, "index.html"))) {
    clientPath = dirPath;
    console.log(`✅ Found client files at: ${clientPath}`);
    break;
  }
}

if (clientPath) {
  app.use(express.static(clientPath));
  app.get("*", (req, res) => {
    if (req.url.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(clientPath, "index.html"));
  });
} else {
  console.log("⚠️ Client files not found. Only API routes will be available.");
  app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Buzzd</title></head><body>
      <h1>Buzzd backend running 🎉</h1><p>No frontend assets found</p></body></html>
    `);
  });
}

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Server error",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
});

// Start the server with port retries
function startServer(port, maxRetries = 3, retryCount = 0) {
  try {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Server running on http://0.0.0.0:${port}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} is busy, trying alternative port...`);
        if (retryCount < maxRetries) {
          // Try alternative ports: 3000, 8080, 4000, 8000
          const alternativePorts = [3000, 8080, 4000, 8000];
          const nextPort = alternativePorts[retryCount] || (port + 1000);
          console.log(`🔄 Retrying with port ${nextPort} (attempt ${retryCount + 1}/${maxRetries})`);
          startServer(nextPort, maxRetries, retryCount + 1);
        } else {
          console.error(`❌ Failed to bind to any ports after ${maxRetries} attempts`);
          console.error('Please manually specify an available port with the PORT environment variable');
          process.exit(1);
        }
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server with the configured port
startServer(PORT);
