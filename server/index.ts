import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { checkConnection as checkCloudflareConnection } from "./services/cloudflare-images";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly serve images from the public/images directory
const imagePath = path.join(process.cwd(), "public/images");
console.log("Serving static images from:", imagePath);
app.use("/images", express.static(imagePath));

const drinkImagesPath = path.join(process.cwd(), "public/images/drinks");
console.log("Serving drink images from:", drinkImagesPath);
app.use("/images/drinks", express.static(drinkImagesPath));

// Direct image handler (with resize)
app.get("/direct-image/:category/:id", async (req, res) => {
  const { category, id } = req.params;
  const { width, height } = req.query;
  const parsedWidth = width ? parseInt(width as string, 10) : undefined;
  const parsedHeight = height ? parseInt(height as string, 10) : undefined;
  const basePath = path.join(process.cwd(), "public/images/drinks");
  let filePath = path.join(basePath, category, id);
  let ext = path.extname(id);
  let exists = fs.existsSync(filePath);

  if (!ext && !exists) {
    for (const e of [".jpeg", ".jpg", ".png", ".webp"]) {
      const tryPath = `${filePath}${e}`;
      if (fs.existsSync(tryPath)) {
        filePath = tryPath;
        ext = e;
        exists = true;
        break;
      }
    }
  }

  if (!exists) return res.status(404).send("Image not found");

  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  const outputFormat: keyof sharp.FormatEnum =
    ext === ".png" ? "png" : ext === ".webp" ? "webp" : "jpeg";
  res.setHeader("Content-Type", contentType);

  const transformer = sharp(filePath);
  if (parsedWidth || parsedHeight) {
    transformer
      .resize({ width: parsedWidth, height: parsedHeight })
      .toFormat(outputFormat, { quality: 80 })
      .pipe(res);
  } else {
    fs.createReadStream(filePath).pipe(res);
  }
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;
  res.json = function (body) {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(
        `${req.method} ${req.path} ${res.statusCode} in ${duration}ms :: ${JSON.stringify(body).slice(0, 80)}…`,
      );
    }
    return originalJson.call(this, body);
  };
  next();
});

(async () => {
  try {
    const cloudflareStatus = await checkCloudflareConnection();
    if (cloudflareStatus.success) {
      console.log("✅ Successfully connected to Cloudflare Images API");
    } else {
      console.warn(`⚠️ ${cloudflareStatus.message}`);
    }
  } catch (error) {
    console.error("❌ Error checking Cloudflare Images connection:", error);
  }

  const port = process.env.PORT || 5000;

  // API routes
  app.use("/api/deals", (await import("./routes/deals")).default);
  app.use(
    "/api/establishments",
    (await import("./routes/establishments")).default,
  );
  app.use("/api/locations", (await import("./routes/locations")).default);
  app.use("/api/collections", (await import("./routes/collections")).default);
  app.use(
    "/api/image-generation",
    (await import("./routes/imageGenerationRoutes")).default,
  );
  app.use("/", (await import("./routes/cloudinaryRoutes")).default);
  app.use("/", (await import("./routes/cloudflare-images")).default);
  app.use("/", (await import("./routes/local-images")).default);

  await registerRoutes(app);

  // Serve static client
  const clientPath = path.join(__dirname, "../dist/public");
  if (fs.existsSync(path.join(clientPath, "index.html"))) {
    app.use(express.static(clientPath));
    app.get("*", (req, res) => {
      if (req.url.startsWith("/api/")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      res.sendFile(path.join(clientPath, "index.html"));
    });
  } else {
    console.log(
      "⚠️ Client files not found. Only API routes will be available.",
    );
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${port}`);
  });
})();
