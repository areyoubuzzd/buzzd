// production-ready.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static frontend files
const publicPath = path.join(__dirname, "dist", "public");
app.use(express.static(publicPath));

// Fallback to index.html for all unmatched routes (SPA behavior)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log("\n=================================================");
  console.log(
    `  BUZZD PRODUCTION SERVER (STARTED: ${new Date().toISOString()})`,
  );
  console.log("=================================================");
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Node Version: ${process.version}`);
  console.log(`Current Directory: ${__dirname}`);
  console.log(`Serving static files from: ${publicPath}`);
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log("=================================================\n");
});
