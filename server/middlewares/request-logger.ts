import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// In-memory store for tracking IP request patterns
interface RequestTracker {
  [ip: string]: {
    requests: Array<{
      url: string;
      timestamp: number;
      userAgent: string;
    }>;
    flags: string[];
  };
}

const requestTracker: RequestTracker = {};

// Suspicious patterns to look for
const suspiciousPatterns = [
  { name: 'rapid-fire', threshold: 30, timeWindow: 60000 }, // 30 requests in 1 minute
  { name: 'data-harvesting', urlPatterns: ['/api/deals', '/api/establishments'], threshold: 20, timeWindow: 300000 }, // 20 data requests in 5 minutes
  { name: 'sequential-scanning', sequential: true, threshold: 10, timeWindow: 300000 }, // Sequential ID access
];

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log directory
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Scraper detection log file
const scraperLogPath = path.join(logDir, 'scraper-detection.log');

// Clean up old tracking data every 24 hours
setInterval(() => {
  const now = Date.now();
  for (const ip in requestTracker) {
    // Remove requests older than 24 hours
    requestTracker[ip].requests = requestTracker[ip].requests.filter(
      req => now - req.timestamp < 86400000
    );
    
    // If no requests left, remove the IP
    if (requestTracker[ip].requests.length === 0) {
      delete requestTracker[ip];
    }
  }
}, 86400000); // 24 hours

// Write to log file
const logSuspiciousActivity = (ip: string, pattern: string, details: string) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] IP: ${ip} | Pattern: ${pattern} | ${details}\n`;
  
  fs.appendFile(scraperLogPath, logEntry, err => {
    if (err) console.error('Error writing to scraper detection log:', err);
  });
  
  console.log(`[Scraper Detection] ${pattern} detected from ${ip}: ${details}`);
};

// Check for suspicious patterns
const detectSuspiciousPatterns = (ip: string | undefined) => {
  // Ensure IP is valid
  if (!ip || ip === 'unknown') return;
  
  const tracker = requestTracker[ip];
  if (!tracker || tracker.requests.length < 5) return;
  
  const now = Date.now();
  
  // Check for rapid-fire requests
  const rapidFirePattern = suspiciousPatterns.find(p => p.name === 'rapid-fire');
  if (rapidFirePattern) {
    const recentRequests = tracker.requests.filter(
      req => now - req.timestamp < rapidFirePattern.timeWindow
    );
    
    if (recentRequests.length >= rapidFirePattern.threshold) {
      // Flag as suspicious if not already flagged for this pattern
      if (!tracker.flags.includes('rapid-fire')) {
        tracker.flags.push('rapid-fire');
        logSuspiciousActivity(
          ip, 
          'rapid-fire', 
          `${recentRequests.length} requests in ${rapidFirePattern.timeWindow / 1000} seconds`
        );
      }
    }
  }
  
  // Check for data harvesting
  const harvestingPattern = suspiciousPatterns.find(p => p.name === 'data-harvesting');
  if (harvestingPattern && harvestingPattern.urlPatterns) {
    const dataRequests = tracker.requests.filter(
      req => now - req.timestamp < harvestingPattern.timeWindow && 
             harvestingPattern.urlPatterns?.some(pattern => req.url.includes(pattern))
    );
    
    if (dataRequests.length >= harvestingPattern.threshold) {
      if (!tracker.flags.includes('data-harvesting')) {
        tracker.flags.push('data-harvesting');
        logSuspiciousActivity(
          ip, 
          'data-harvesting', 
          `${dataRequests.length} data API requests in ${harvestingPattern.timeWindow / 1000} seconds`
        );
      }
    }
  }
  
  // Check for sequential ID scanning
  const sequentialPattern = suspiciousPatterns.find(p => p.name === 'sequential-scanning');
  if (sequentialPattern) {
    const recentRequests = tracker.requests
      .filter(req => now - req.timestamp < sequentialPattern.timeWindow)
      .map(req => req.url);
    
    // Extract IDs from URL patterns like /api/deals/123, /api/establishments/456
    const idRequests: number[] = [];
    recentRequests.forEach(url => {
      const match = url.match(/\/api\/[a-z]+\/(\d+)/);
      if (match && match[1]) {
        idRequests.push(parseInt(match[1]));
      }
    });
    
    // Check if IDs are sequential
    if (idRequests.length >= sequentialPattern.threshold) {
      let sequentialCount = 0;
      for (let i = 1; i < idRequests.length; i++) {
        if (idRequests[i] === idRequests[i-1] + 1) {
          sequentialCount++;
        }
      }
      
      if (sequentialCount >= sequentialPattern.threshold - 1) {
        if (!tracker.flags.includes('sequential-scanning')) {
          tracker.flags.push('sequential-scanning');
          logSuspiciousActivity(
            ip, 
            'sequential-scanning', 
            `${sequentialCount + 1} sequential ID requests detected`
          );
        }
      }
    }
  }
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const url = req.originalUrl;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const timestamp = Date.now();
  
  // Initialize tracker for this IP if it doesn't exist
  if (!requestTracker[clientIp]) {
    requestTracker[clientIp] = {
      requests: [],
      flags: []
    };
  }
  
  // Add this request to the tracker
  requestTracker[clientIp].requests.push({
    url,
    timestamp,
    userAgent: typeof userAgent === 'string' ? userAgent : Array.isArray(userAgent) ? userAgent[0] : 'Unknown'
  });
  
  // Check for suspicious patterns
  detectSuspiciousPatterns(clientIp);
  
  // Add request logging header (base64 encoded IP + timestamp for tracking)
  const trackingId = Buffer.from(`${clientIp}:${timestamp}`).toString('base64');
  res.setHeader('X-Request-ID', trackingId);
  
  next();
};