import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Generate a HMAC signature to validate requests
const generateSignature = (data: any, secret: string): string => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
};

// Simple rate limiting map (in a real production app, use Redis)
const requestCounts: Record<string, { count: number, timestamp: number }> = {};

// Clean up old rate limiting entries every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(requestCounts).forEach(key => {
    if (now - requestCounts[key].timestamp > 3600000) { // 1 hour
      delete requestCounts[key];
    }
  });
}, 3600000);

export const apiProtection = (publicEndpoints: boolean = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Log request for monitoring
    console.log(`[API Access] ${req.ip} → ${req.method} ${req.originalUrl}`);
    
    // Add the request to our rate limiting tracker
    const clientIp = req.ip;
    const now = Date.now();
    
    if (!requestCounts[clientIp]) {
      requestCounts[clientIp] = { count: 0, timestamp: now };
    }
    
    // Reset counter if it's been more than 15 minutes
    if (now - requestCounts[clientIp].timestamp > 900000) {
      requestCounts[clientIp].count = 0;
      requestCounts[clientIp].timestamp = now;
    }
    
    requestCounts[clientIp].count++;
    
    // Basic rate limiting
    if (requestCounts[clientIp].count > 100) { // 100 requests per 15 minutes
      return res.status(429).json({ 
        error: 'Too many requests', 
        message: 'Rate limit exceeded. Please try again later.'
      });
    }
    
    // For public endpoints (like collections listing), we're just doing rate limiting
    if (publicEndpoints) {
      return next();
    }
    
    // For protected endpoints, check authentication
    if (req.isAuthenticated()) {
      // User is logged in, allow access
      return next();
    }
    
    // Check for API token
    const authHeader = req.headers.authorization;
    const apiKey = process.env.API_KEY || 'buzzd_default_api_key'; // Fallback key for dev
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check if token matches our API key
      if (token === apiKey) {
        return next();
      }
      
      // Or validate using timestamp and signature (for external apps)
      const timestamp = req.headers['x-timestamp'] as string;
      const signature = req.headers['x-signature'] as string;
      
      if (timestamp && signature) {
        // Check if timestamp is recent (within 5 minutes)
        const timestampNum = parseInt(timestamp, 10);
        if (isNaN(timestampNum) || now - timestampNum > 300000) { // 5 minutes
          return res.status(401).json({ error: 'Expired signature' });
        }
        
        // Validate signature
        const data = { url: req.originalUrl, timestamp };
        const expectedSignature = generateSignature(data, apiKey);
        
        if (signature === expectedSignature) {
          return next();
        }
      }
    }
    
    // For API endpoints that should be accessible to logged-out users:
    // Add specific checks here if needed
    
    // Respond with a 401 for all other requests
    const clientUserAgent = req.headers['user-agent'] || 'Unknown';
    console.log(`[Unauthorized API Access] ${clientIp} with UA: ${clientUserAgent}`);
    
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Please login or provide valid API credentials to access this resource.'
    });
  };
};

// Honeypot detection - for forms
export const honeypotCheck = (req: Request, res: Response, next: NextFunction) => {
  // Check if the honeypot field was filled
  if (req.body.robotCheck && req.body.robotCheck.length > 0) {
    // Bot detected! Log it and return a fake success
    console.log(`[Bot Detected] ${req.ip} filled honeypot field`);
    // Return success but don't process (silently fail)
    return res.status(200).json({ success: true });
  }
  
  // Not a bot, continue
  next();
};