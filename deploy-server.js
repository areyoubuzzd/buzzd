/**
 * Ultra-minimal production server for Buzzd app - ES Module Version
 * Version 1.2.0 (Fixed)
 */

import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodeFetch from 'node-fetch';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/servercheck', async (req, res) => {
  try {
    const innerPort = parseInt(process.env.PORT || '3000') + 1;
    let dbStatus = 'unknown';
    let dbDetails = '';
    try {
      const pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'error';
      dbDetails = err.message;
    }

    let innerServerRunning = false;
    let innerServerDetails = 'not responding';
    let apiEndpoints = ['/api/collections', '/api/deals/collections/all?lat=1.3521&lng=103.8198'];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await nodeFetch(`http://localhost:${innerPort}${endpoint}`);
        if (response.ok) {
          innerServerRunning = true;
          innerServerDetails = `responding on ${endpoint}`;
          break;
        } else {
          innerServerDetails = `responded with status ${response.status} on ${endpoint}`;
        }
      } catch (e) {
        innerServerDetails = `connection failed on ${endpoint}: ${e.message}`;
      }
    }

    let innerServerStarted = false;
    try {
      const childProcess = exec('ps aux | grep "tsx server/index.ts" | grep -v grep');
      childProcess.stdout.on('data', (data) => {
        if (data.trim()) innerServerStarted = true;
      });
    } catch {}

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: 'deploy-server',
      version: '1.2.0',
      database: {
        status: dbStatus,
        details: dbDetails
      },
      innerServer: {
        running: innerServerRunning,
        processFound: innerServerStarted,
        status: innerServerRunning ? 'running' : 'starting',
        details: innerServerDetails,
        port: innerPort
      },
      env: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'not configured',
        PORT: process.env.PORT || 'not set'
      }
    });
  } catch (error) {
    res.json({ status: 'error', error: error.message, timestamp: new Date().toISOString() });
  }
});

app.all('/api/*', async (req, res, next) => {
  try {
    const innerPort = parseInt(process.env.PORT || '3000') + 1;
    const apiUrl = `http://localhost:${innerPort}${req.url}`;
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body);
    const response = await nodeFetch(apiUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body
    });
    res.status(response.status);
    const data = await response.text();
    res.send(data);
  } catch (error) {
    res.status(502).json({ error: 'Server starting', message: 'Try again shortly.' });
  }
});

console.log(`\n=== DEPLOYMENT SERVER STARTING UP ===\nNODE_ENV: ${process.env.NODE_ENV || 'not set'}\nDATABASE_URL: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}\nPORT: ${PORT}\n====================================`);

exec('pkill -f "tsx server/index.ts" || true', (error) => {
  if (!error) console.log('Cleaned up any existing server processes');

  const innerPort = parseInt(PORT) + 1;
  console.log(`Starting inner server on port ${innerPort}...`);
  const serverProcess = exec(`tsx server/index.ts`, {
    env: {
      ...process.env,
      PORT: innerPort.toString(),
      NODE_ENV: process.env.NODE_ENV || 'production',
      DATABASE_URL: process.env.DATABASE_URL,
      DEPLOYMENT_ENVIRONMENT: 'true'
    }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data.trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data.trim()}`);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
});

const possibleClientPaths = ['dist', 'client/dist', 'dist/public', 'client', 'public'];
let clientDirectory = null;
for (const dir of possibleClientPaths) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    if (files.includes('index.html') || files.includes('assets')) {
      clientDirectory = dir;
      console.log(`Found client files in: ${dir}`);
      break;
    }
  }
}

if (clientDirectory) {
  console.log(`Serving static files from: ${clientDirectory}`);
  app.use(express.static(clientDirectory));
}

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (clientDirectory && fs.existsSync(`${clientDirectory}/index.html`)) {
    return res.sendFile(path.resolve(`${clientDirectory}/index.html`));
  }
  res.status(200).send(`<!DOCTYPE html>
    <html>
    <head>
      <title>Buzzd - Starting Up</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: sans-serif; background: #1c1c1c; color: #fff; text-align: center; padding: 50px 20px; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #ff9b42; font-size: 2em; margin-bottom: 10px; }
        p { line-height: 1.6; opacity: 0.9; }
        .loader { border: 5px solid rgba(255, 155, 66, 0.2); border-top: 5px solid #ff9b42; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 30px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .subtitle { color: #ff9b42; font-weight: bold; }
        .status { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 5px; margin-top: 30px; text-align: left; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Buzzd App</h1>
        <p class="subtitle">Deployment In Progress</p>
        <div class="loader"></div>
        <p>Please wait while the server initializes...</p>
        <p>This process may take up to 30 seconds.</p>
        <div class="status">
          <p>Server Status: Starting main application</p>
          <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
          <p>Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}</p>
          <p>WebSocket Support: ${typeof ws !== 'undefined' ? 'Enabled' : 'Disabled'}</p>
          <p id="connection-status">Checking inner server...</p>
        </div>
      </div>
      <script>
        function checkServerStatus() {
          const statusEl = document.getElementById('connection-status');
          statusEl.textContent = "Checking connection to server...";
          fetch('/api/servercheck')
            .then(response => response.json())
            .then(data => {
              if (data.database && data.database.status) {
                const dbStatusInfo = \`Database: \${data.database.status}\`;
                statusEl.textContent = dbStatusInfo;
                if (data.database.status === 'error') {
                  statusEl.innerHTML = \`Database: <span style='color: #ff5252'>Error</span> - \${data.database.details || 'Unknown error'}\`;
                }
              }
              if (data.ok === true && data.message === "Inner server is alive") {
                statusEl.innerHTML = '<span style="color: #52ff7a">✅ Inner server is alive, loading app...</span>';
                setTimeout(() => window.location.reload(), 1000);
              } else if (data.innerServer === 'running') {
                statusEl.innerHTML = '<span style="color: #52ff7a">✅ Inner server is running, loading app...</span>';
                setTimeout(() => window.location.reload(), 1000);
              } else {
                statusEl.textContent = "Inner server starting... Checking again in 3 seconds";
                setTimeout(checkServerStatus, 3000);
              }
            })
            .catch(err => {
              statusEl.innerHTML = \`<span style='color: #ff5252'>Error connecting to server</span>: \${err.message}\`;
              setTimeout(checkServerStatus, 3000);
            });
        }
        setTimeout(checkServerStatus, 3000);
      </script>
    </body>
</html>`);
}); // ← this closes the app.get('*', ...) route

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  exec('pkill -f "tsx server/index.ts" || true');
  process.exit(0);
});
