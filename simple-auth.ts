import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

// Simple login without OTP - just verify email format and create/login user
async function loginWithEmail(email: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Check if user exists
    let user = await storage.getUserByEmail(email);
    
    if (!user) {
      // Create new user
      const userId = Math.random().toString(36).substring(2, 15);
      user = await storage.createUser({
        id: userId,
        email: email,
        firstName: email.split('@')[0],
        lastName: '',
        profileImageUrl: null,
      });
    }
    
    console.log(`✅ User logged in: ${email} (ID: ${user.id})`);
    return { success: true, userId: user.id };
  } catch (error) {
    console.log(`❌ Login failed for ${email}:`, error);
    return { success: false, error: 'Login failed' };
  }
}

export async function setupAuth(app: Express) {
  app.use(getSession());

  // Simple email login endpoint - no OTP required
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('🔐 Login Request:', req.body);
      const { email } = req.body;
      
      if (!email) {
        console.log('❌ Missing email');
        return res.status(400).json({ message: 'Email is required' });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      const result = await loginWithEmail(email);
      
      if (!result.success) {
        return res.status(500).json({ message: result.error || 'Login failed' });
      }

      // Store user in session
      req.session.user = {
        id: result.userId,
        email: email
      };

      console.log('✅ Login successful');
      res.json({ message: 'Login successful', user: { id: result.userId, email } });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });



  // Get current user
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = await storage.getUser(req.session.user.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Logout error:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      console.log('✅ User logged out successfully');
      res.json({ message: 'Logged out successfully' });
    });
  });


}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  console.log('🔐 Auth check - Session user:', req.session?.user);
  
  if (!req.session?.user) {
    console.log('❌ No session user found');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await storage.getUser(req.session.user.id);
  if (!user) {
    console.log('❌ User not found in DB:', req.session.user.id);
    return res.status(401).json({ message: 'User not found' });
  }

  // Attach user to request
  req.user = user;
  console.log('✅ User authenticated:', req.user.id);
  next();
};