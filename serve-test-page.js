// Simple server to serve our test HTML page
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Serve the test HTML page at the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-cloudinary-images.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cloudinary image test server running at http://localhost:${PORT}`);
});