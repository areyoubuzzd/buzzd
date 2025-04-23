/**
 * Buzzd Production-Ready Server with API Proxy Fallback and Static Hosting
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log(`
=================================================
  BUZZD PRODUCTION SERVER (STARTED: ${new Date().toISOString()})
=================================================
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}
Current Directory: ${process.cwd()}
=================================================
`);

// ✅ Write fallback index.html
fs.writeFileSync('index.html', `<!DOCTYPE html><html><body><h1>Buzzd</h1><p>Coming Soon</p></body></html>`);
console.log('✅ Created fallback index.html');

// ✅ Find client build folder dynamically
const possibleClientPaths = ['dist/public', 'client/dist', 'dist', 'client', 'public'];
let clientPath = '';
for (const pathOption of possibleClientPaths) {
  try {
    if (fs.existsSync(pathOption) && fs.statSync(pathOption).isDirectory()) {
      const files = fs.readdirSync(pathOption);
      if (files.includes('index.html') || files.includes('assets')) {
        clientPath = pathOption;
        console.log(`✅ Found client files at: ${pathOption}`);
        break;
      }
    }
  } catch (err) {
    console.error(`Error checking path ${pathOption}:`, err);
  }
}

// ✅ Serve static files from client path
if (clientPath) {
  app.use(express.static(clientPath));
  console.log(`Serving static files from ${clientPath}`);
} else {
  console.log('❌ No client directory found, using fallback');
}

// ✅ Serve additional folders like public/assets
['dist/client', 'public', 'public/assets', 'public/images', 'assets'].forEach(dir => {
  if (fs.existsSync(dir)) {
    app.use('/' + path.basename(dir), express.static(dir));
    console.log(`Serving additional assets from ${dir}`);
  }
});

// ✅ Start backend API server
let apiProcess;
try {
  console.log(`Starting API server on port ${API_PORT}...`);
  apiProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: API_PORT.toString(),
      DISABLE_CLOUDINARY: 'true',
      DISABLE_CLOUDFLARE: 'true',
      NODE_ENV: 'production'
    }
  });

  apiProcess.on('error', err => console.error('Failed to start API server:', err));
} catch (error) {
  console.error('Error starting API server:', error);
}

// ✅ Proxy API requests to API_PORT
app.all('/api/*', async (req, res) => {
  const fetch = (await import('node-fetch')).default;
  const tryUrls = [`http://127.0.0.1:${API_PORT}${req.url}`, `http://0.0.0.0:${API_PORT}${req.url}`];
  let lastError = null;

  for (const apiUrl of tryUrls) {
    try {
      const response = await fetch(apiUrl, {
        method: req.method,
        headers: {
          'Content-Type': req.get('Content-Type') || 'application/json',
          'Accept': req.get('Accept') || 'application/json',
          'Cookie': req.get('Cookie') || '',
        },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      });

      res.status(response.status);
      response.headers.forEach((v, n) => {
        if (n !== 'transfer-encoding') res.setHeader(n, v);
      });
      res.send(await response.text());
      return;
    } catch (err) {
      lastError = err;
      console.error(`❌ Failed to proxy to ${apiUrl}:`, err.message);
    }
  }

  res.status(502).json({ error: 'API unavailable', message: lastError?.message || 'Unknown error' });
});

// ✅ Simple test routes
app.get('/api-test', (req, res) => {
  res.json({
    status: 'API Test',
    apiProcess: apiProcess ? 'Started' : 'Not started',
    environment: process.env.NODE_ENV,
    port: PORT,
    apiPort: API_PORT,
    clientPath
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ✅ Fallback: React app routing (SPA)
app.get('*', (req, res) => {
  if (clientPath && fs.existsSync(path.join(clientPath, 'index.html'))) {
    return res.sendFile(path.resolve(path.join(clientPath, 'index.html')));
  }
  res.sendFile(path.resolve('index.html'));
});

// ✅ Start the frontend server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
=================================================
  SERVER STARTED
=================================================
Frontend: http://localhost:${PORT}
API: http://localhost:${API_PORT}
=================================================
`);
});
