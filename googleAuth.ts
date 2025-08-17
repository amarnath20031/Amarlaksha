import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { EmailBasedStorage } from "./emailStorage";

const storage = new EmailBasedStorage();

// Check credentials at runtime in setup function instead of module load
console.log('🔍 Checking Google OAuth credentials...');
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'laksha-dev-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupGoogleAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Check credentials again at setup time and configure OAuth
  console.log('🔧 Setting up Google OAuth with credentials check...');
  console.log('CLIENT_ID available:', !!process.env.GOOGLE_CLIENT_ID);
  console.log('CLIENT_SECRET available:', !!process.env.GOOGLE_CLIENT_SECRET);
  
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ Google OAuth credentials found, configuring strategy...');
    
    // Use new .com domain for production, dev domain for development
    const prodDomain = process.env.DOMAIN || 'lakshacoach.com';
    const devDomain = process.env.REPLIT_DOMAINS || 'de384773-55f3-42ff-9f47-1a824635715d-00-10fka5wnjlv6x.spock.replit.dev';
    
    // Check if we're in production or development
    const currentDomain = process.env.NODE_ENV === 'production' ? prodDomain : devDomain;
    const callbackURL = `https://${currentDomain}/api/auth/google/callback`;
    
    console.log('🔗 Using callback URL:', callbackURL);
    console.log('🌐 Current domain:', currentDomain);
    console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔐 Google OAuth callback - profile:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName
      });

      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email provided by Google'), false);
      }

      // Check if user exists, if not create new user
      let user = await storage.getUserByEmail(email);
      let isNewUser = false;
      
      if (!user) {
        console.log('🆕 Creating new user for email:', email);
        user = await storage.createUser({
          email,
          googleId: profile.id,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          profileImageUrl: profile.photos?.[0]?.value || '',
        });
        isNewUser = true;
      } else {
        console.log('👤 Existing user found for email:', email);
        // Update Google ID if not set
        if (!user.googleId) {
          await storage.updateUser(email, { googleId: profile.id });
        }
      }

      // Store new user flag in the user object temporarily
      (user as any).isNewUser = isNewUser;

      return done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      return done(error, false);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    console.log('📦 Serializing user:', user.email);
    done(null, user.email);
  });

  // Deserialize user from session
  passport.deserializeUser(async (email: string, done) => {
    try {
      console.log('🔄 Deserializing user with email:', email);
      const user = await storage.getUserByEmail(email);
      console.log('👤 Deserialized user found:', !!user);
      if (user) {
        console.log('👤 User details:', { email: user.email, username: user.username, hasGoogleId: !!user.googleId });
      }
      done(null, user);
    } catch (error) {
      console.error('❌ User deserialization error:', error);
      done(null, false); // Return false instead of error to prevent auth failure
    }
  });

    // Google OAuth routes (only if credentials are configured)
    app.get('/api/auth/google', 
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback', 
      passport.authenticate('google', { failureRedirect: '/' }),
      (req: any, res) => {
        console.log('✅ Google OAuth success, checking user agent for redirect');
        console.log('🔍 User-Agent:', req.get('User-Agent'));
        
        // Store isNewUser flag in session for frontend access
        if (req.user && req.user.isNewUser) {
          req.session.isNewUser = true;
          console.log('🆕 New user flag set in session for:', req.user.email);
        }
        
        // Check if request is from Android WebView (APK) or mobile app
        const userAgent = req.get('User-Agent') || '';
        const isAndroidWebView = /wv\)/.test(userAgent) || 
                               /Android.*AppleWebKit(?!.*Chrome)/.test(userAgent) ||
                               /Version\/[\d.]+.*Chrome\/[.\d]+.*Mobile.*Safari/.test(userAgent) ||
                               /LakshaApp/.test(userAgent); // Custom app identifier
        
        if (isAndroidWebView) {
          console.log('📱 Android WebView detected, showing success page');
          // For Android APK, show a success page with instructions
          res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Login Successful - Laksha</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 0; 
                        padding: 20px;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .container {
                        background: white;
                        border-radius: 12px;
                        padding: 40px 30px;
                        text-align: center;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                        max-width: 400px;
                        width: 100%;
                    }
                    .success-icon {
                        width: 60px;
                        height: 60px;
                        background: #10B981;
                        border-radius: 50%;
                        margin: 0 auto 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 30px;
                        color: white;
                    }
                    h1 { color: #1F2937; margin-bottom: 16px; font-size: 24px; }
                    p { color: #6B7280; margin-bottom: 24px; line-height: 1.6; }
                    .btn {
                        background: #10B981;
                        color: white;
                        padding: 12px 24px;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-block;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success-icon">✓</div>
                    <h1>Login Successful!</h1>
                    <p>You have successfully signed in to Laksha with Google. Please close this page and return to the Laksha app to continue.</p>
                    <button class="btn" onclick="window.close()">Close</button>
                </div>
                <script>
                    // Auto-close after 3 seconds
                    setTimeout(() => {
                        if (window.opener) {
                            window.close();
                        }
                    }, 3000);
                </script>
            </body>
            </html>
          `);
        } else {
          console.log('🌐 Web browser detected, using standard redirect');
          res.redirect('/');
        }
      }
    );
  } else {
    // Fallback routes when Google OAuth is not configured
    app.get('/api/auth/google', (req, res) => {
      res.status(500).json({ message: 'Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
    });

    app.get('/api/auth/google/callback', (req, res) => {
      res.status(500).json({ message: 'Google OAuth not configured.' });
    });
  }

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('❌ Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      console.log('👋 User logged out');
      res.json({ message: 'Logged out successfully' });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  console.log('🔐 Auth check - isAuthenticated:', req.isAuthenticated(), 'user:', req.user);
  console.log('🔐 Session:', req.session);
  
  if (req.isAuthenticated() && req.user) {
    console.log('✅ User authenticated:', req.user.email);
    return next();
  }
  
  console.log('❌ Authentication failed');
  return res.status(401).json({ message: "Unauthorized" });
};