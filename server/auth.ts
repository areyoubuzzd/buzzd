import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "happy-hour-hunt-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Check if input is an email
        const isEmail = username.includes('@');
        let user;
        
        if (isEmail) {
          user = await storage.getUserByEmail(username);
        } else {
          user = await storage.getUserByUsername(username);
        }
        
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Traditional username/password registration
  app.post("/api/register", async (req, res, next) => {
    try {
      // Ensure this is a local auth registration
      if (req.body.authProvider !== 'local') {
        return res.status(400).json({ message: "Invalid auth provider for this endpoint" });
      }

      // Check if username exists
      if (req.body.username) {
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }

      // Check if email exists
      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      // Create user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        lastLoginAt: new Date(),
      });

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send the password hash to the client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Traditional username/password login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Update last login timestamp
        storage.updateLastLogin(user.id).catch(console.error);
        
        // Don't send the password hash to the client
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Google authentication
  app.post("/api/auth/google", async (req, res, next) => {
    try {
      const { idToken, authProvider } = req.body;
      
      if (!idToken || authProvider !== 'google') {
        return res.status(400).json({ message: "Invalid request parameters" });
      }
      
      // Note: In a real implementation, you'd validate the Google ID token here
      // For this mock implementation, we'll simulate token verification
      
      // Simulated token decode result
      const tokenPayload = {
        email: req.body.email || 'google_user@example.com',
        name: req.body.displayName || 'Google User',
        picture: req.body.photoUrl || null,
        sub: `google_${Date.now()}`, // In a real app, this would be the Google user ID
      };
      
      // Check if user exists with this Google ID
      let user = await storage.getUserByProviderId('google', tokenPayload.sub);
      
      if (!user) {
        // Check if user exists with this email
        user = await storage.getUserByEmail(tokenPayload.email);
        
        if (user) {
          if (user.authProvider !== 'google') {
            // If user exists with same email but different auth provider
            return res.status(400).json({ 
              message: "Email already registered with a different authentication method" 
            });
          }
          
          // Update the existing Google user if needed
          user = await storage.updateUser(user.id, {
            displayName: tokenPayload.name,
            photoUrl: tokenPayload.picture,
            lastLoginAt: new Date(),
          });
        } else {
          // Create new Google user
          user = await storage.createUser({
            email: tokenPayload.email,
            displayName: tokenPayload.name,
            photoUrl: tokenPayload.picture,
            authProvider: 'google',
            authProviderId: tokenPayload.sub,
            lastLoginAt: new Date(),
          });
        }
      } else {
        // Update last login timestamp
        user = await storage.updateLastLogin(user.id);
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send the password hash to the client
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Apple authentication
  app.post("/api/auth/apple", async (req, res, next) => {
    try {
      const { idToken, authProvider } = req.body;
      
      if (!idToken || authProvider !== 'apple') {
        return res.status(400).json({ message: "Invalid request parameters" });
      }
      
      // Note: In a real implementation, you'd validate the Apple ID token here
      // For this mock implementation, we'll simulate token verification
      
      // Simulated token decode result
      const tokenPayload = {
        email: req.body.email || 'apple_user@example.com',
        name: req.body.displayName || 'Apple User',
        sub: `apple_${Date.now()}`, // In a real app, this would be the Apple user ID
      };
      
      // Check if user exists with this Apple ID
      let user = await storage.getUserByProviderId('apple', tokenPayload.sub);
      
      if (!user) {
        // Check if user exists with this email
        user = await storage.getUserByEmail(tokenPayload.email);
        
        if (user) {
          if (user.authProvider !== 'apple') {
            // If user exists with same email but different auth provider
            return res.status(400).json({ 
              message: "Email already registered with a different authentication method" 
            });
          }
          
          // Update the existing Apple user if needed
          user = await storage.updateUser(user.id, {
            displayName: tokenPayload.name,
            lastLoginAt: new Date(),
          });
        } else {
          // Create new Apple user
          user = await storage.createUser({
            email: tokenPayload.email,
            displayName: tokenPayload.name,
            authProvider: 'apple',
            authProviderId: tokenPayload.sub,
            lastLoginAt: new Date(),
          });
        }
      } else {
        // Update last login timestamp
        user = await storage.updateLastLogin(user.id);
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send the password hash to the client
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Phone authentication - request verification code
  app.post("/api/auth/phone/request-code", async (req, res, next) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      // In a real implementation, you would:
      // 1. Validate the phone number format
      // 2. Generate a verification code
      // 3. Send the code via SMS
      // 4. Store the code and phone number in a temporary storage with expiration
      
      // For this mock implementation, we'll simulate sending a code
      const verificationCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
      
      // In a real app, you would store this code securely with the phone number
      // For now, we'll use a fixed code for testing
      console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);
      
      // In a real app, we'd send the SMS here
      
      res.status(200).json({ success: true, message: "Verification code sent" });
    } catch (error) {
      next(error);
    }
  });

  // Phone authentication - verify code
  app.post("/api/auth/phone/verify", async (req, res, next) => {
    try {
      const { phoneNumber, verificationCode, authProvider } = req.body;
      
      if (!phoneNumber || !verificationCode || authProvider !== 'phone') {
        return res.status(400).json({ message: "Invalid request parameters" });
      }
      
      // In a real implementation, you would verify the code from your storage
      // For this mock implementation, we'll accept any 4-digit code
      if (verificationCode.length !== 4 || !/^\d+$/.test(verificationCode)) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      // Check if user exists with this phone number
      let user = await storage.getUserByPhoneNumber(phoneNumber);
      
      if (!user) {
        // Create new phone user
        user = await storage.createUser({
          phoneNumber,
          displayName: null,
          authProvider: 'phone',
          lastLoginAt: new Date(),
        });
      } else {
        // Update last login timestamp
        user = await storage.updateLastLogin(user.id);
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send the password hash to the client
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Don't send the password hash to the client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Update user subscription
  app.post("/api/user/subscription", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { tier } = req.body;
      if (tier !== 'free' && tier !== 'premium') {
        return res.status(400).json({ message: "Invalid subscription tier" });
      }
      
      const user = await storage.updateUserSubscription(req.user.id, tier);
      
      // Don't send the password hash to the client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
}
