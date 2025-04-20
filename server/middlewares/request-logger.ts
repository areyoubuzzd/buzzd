/**
 * Request Logger Middleware
 * 
 * This middleware logs and monitors API requests to detect suspicious activity 
 * such as scraping attempts or brute force attacks.
 */

import { Request, Response, NextFunction } from 'express';

// Track request counts per IP for rate limiting and scraping detection
interface RequestData {
  count: number;
  timestamps: number[];
  paths: Set<string>;
}

const requestLog: Map<string, RequestData> = new Map();

// How many requests in how many seconds to consider suspicious
const RATE_LIMIT_THRESHOLD = 25;  // requests
const RATE_LIMIT_WINDOW = 60;     // seconds
const PATHS_THRESHOLD = 10;       // unique paths

// Clear old entries from the log every hour
setInterval(() => {
  const now = Date.now();
  const cutoff = now - (RATE_LIMIT_WINDOW * 1000);
  
  requestLog.forEach((data, ip) => {
    // Remove timestamps older than our window
    data.timestamps = data.timestamps.filter(time => time > cutoff);
    
    // If all timestamps are gone, remove the entry
    if (data.timestamps.length === 0) {
      requestLog.delete(ip);
    }
  });
}, 3600000); // Every hour

/**
 * Checks for rapid-fire requests that might indicate scraping
 */
function checkForScrapingPatterns(ip: string, data: RequestData): boolean {
  const now = Date.now();
  const cutoff = now - (RATE_LIMIT_WINDOW * 1000);
  
  // Count requests within our time window
  const recentRequests = data.timestamps.filter(time => time > cutoff).length;
  
  // Rapid-fire detection
  if (recentRequests >= RATE_LIMIT_THRESHOLD) {
    console.log(`[Scraper Detection] rapid-fire detected from ${ip}: ${recentRequests} requests in ${RATE_LIMIT_WINDOW} seconds`);
    return true;
  }
  
  // Breadth-first crawling detection (checking many different paths)
  if (data.paths.size >= PATHS_THRESHOLD) {
    console.log(`[Scraper Detection] breadth-first crawling detected from ${ip}: ${data.paths.size} unique paths`);
    return true;
  }
  
  return false;
}

/**
 * The main request logger middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const path = req.originalUrl || req.url;
  const method = req.method;
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Initialize or update request data for this IP
  if (!requestLog.has(ip)) {
    requestLog.set(ip, {
      count: 0,
      timestamps: [],
      paths: new Set()
    });
  }
  
  const data = requestLog.get(ip)!;
  data.count++;
  data.timestamps.push(Date.now());
  data.paths.add(path);
  
  // Log all API access attempts
  if (path.startsWith('/api/')) {
    console.log(`[API Access] ${ip} → ${method} ${path}`);
  }
  
  // Check for suspicious patterns
  const suspicious = checkForScrapingPatterns(ip, data);
  
  if (suspicious) {
    // Add a delay to slow down scrapers
    setTimeout(() => {
      next();
    }, 2000);
  } else {
    next();
  }
};