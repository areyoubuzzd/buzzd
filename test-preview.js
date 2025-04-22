import express from 'express';

const app = express();
const PORT = 3000;

// Serve simple HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Buzzd App</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;
          background-color: #1e1e2e;
          color: #cdd6f4;
        }
        h1 {
          color: #f5c2e7;
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 1.2rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        .logo {
          font-size: 4rem;
          margin-bottom: 2rem;
        }
        .card {
          background-color: #313244;
          border-radius: 10px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .btn {
          display: inline-block;
          background-color: #cba6f7;
          color: #1e1e2e;
          padding: 0.8rem 1.5rem;
          border-radius: 5px;
          text-decoration: none;
          font-weight: bold;
          margin: 1rem;
          transition: all 0.2s ease;
        }
        .btn:hover {
          background-color: #f5c2e7;
          transform: translateY(-2px);
        }
        .endpoints {
          text-align: left;
          background-color: #313244;
          border-radius: 10px;
          padding: 1.5rem;
          margin-top: 2rem;
        }
        .endpoints h3 {
          color: #89b4fa;
        }
        code {
          font-family: monospace;
          background-color: #45475a;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          margin: 0.2rem;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="logo">🍹</div>
      <h1>Buzzd App - Preview Test</h1>
      
      <div class="card">
        <p>This is a simple preview test page for the Buzzd Happy Hour App.</p>
        <p>The server is running successfully at port ${PORT}!</p>
        <a href="/api/test" class="btn">Test API Endpoint</a>
      </div>
      
      <div class="endpoints">
        <h3>Available API Endpoints:</h3>
        <p><code>GET /</code> - This page</p>
        <p><code>GET /api/test</code> - Test endpoint that returns JSON</p>
      </div>
    </body>
    </html>
  `);
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    appName: 'Buzzd Happy Hour App'
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test preview server is running on http://0.0.0.0:${PORT}`);
});