import { Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import storage from "../storage"; // adjust the path if needed

export function setupAuth(app: Express) {
  // Session middleware (needed for passport sessions)
  app.use(session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth strategy
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await storage.getUserByEmail(profile.emails?.[0].value || "");
        if (!user) {
          user = await storage.createUser({
            id: `user_${Date.now()}`,
            email: profile.emails?.[0].value || null,
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            profileImageUrl: profile.photos?.[0].value || null,
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  ));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Routes
  app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      // Redirect to your frontend after successful login
      res.redirect("http://localhost:3000/dashboard");
    }
  );

  // Optional: check current user
  app.get("/api/auth/me", (req, res) => {
    res.json(req.user || null);
  });

  // Optional: logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout(err => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
}