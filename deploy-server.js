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
    const innerPort = parseInt(PORT.toString()) + 1;
    let dbStatus = 'unknown';
    let dbDetails = '';

    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
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
    const apiEndpoints = [
      '/api/collections',
      '/api/deals/collections/all?lat=1.3521&lng=103.8198',
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await nodeFetch(`http://localhost:${innerPort}${endpoint}`);
        if (response.ok) {
          innerServerRunning = true;
          innerServerDetails = `responding on ${endpoint}`;
          break;
        } else {
          innerServerDetails = `status ${response.status} on ${endpoint}`;
        }
      } catch (e) {
        innerServerDetails = `error on ${endpoint}: ${e.message}`;
      }
    }

    res.json({
      ok: true,
      status: 'ok',
      server: 'deploy-server',
      version: '1.2.3',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        details: dbDetails,
      },
      innerServer: {
        running: innerServerRunning,
        status: innerServerRunning ? 'running' : 'starting',
        details: innerServerDetails,
        port: innerPort,
      },
      env: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'not configured',
        PORT: PORT,
      },
    });
  } catch (error) {
    res.json({ status: 'error', error: error.message, timestamp: new Date().toISOString() });
  }
});

app.all('/api/*', async (req, res) => {
  const innerPort = parseInt(PORT.toString()) + 1;
  const apiUrl = `http://localhost:${innerPort}${req.url}`;
  try {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body);
    const response = await nodeFetch(apiUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
    });
    res.status(response.status);
    const data = await response.text();
    res.send(data);
  } catch (error) {
    res.status(502).json({ error: 'Server starting', message: 'Try again shortly.' });
  }
});

console.log(`
=== DEPLOYMENT SERVER STARTING UP ===
NODE_ENV: ${process.env.NODE_ENV || 'not set'}
DATABASE_URL: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}
PORT: ${PORT}
====================================`);

exec('pkill -f "tsx server/index.ts" || true', () => {
  const innerPort = parseInt(PORT.toString()) + 1;
  console.log(`Starting inner server on port ${innerPort}...`);
  const serverProcess = exec(`tsx server/index.ts`, {
    env: {
      ...process.env,
      PORT: innerPort.toString(),
      NODE_ENV: process.env.NODE_ENV || 'production',
      DATABASE_URL: process.env.DATABASE_URL,
      DEPLOYMENT_ENVIRONMENT: 'true',
    },
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

const clientDirectory = path.resolve(__dirname, 'client/dist/public');
if (fs.existsSync(path.join(clientDirectory, 'index.html'))) {
  console.log(`✅ Serving static files from: ${clientDirectory}`);
  app.use(express.static(clientDirectory));
} else {
  console.error(`❌ Could not find index.html in: ${clientDirectory}`);
}

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.resolve(clientDirectory, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  exec('pkill -f "tsx server/index.ts" || true');
  process.exit(0);
});