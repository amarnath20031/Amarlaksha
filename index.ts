import express from "express";
import { log, setupVite, serveStatic } from "../shared/server/vite";
import { registerRoutes } from "../shared/server/routes";

const app = express();

// Set up middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Bind to 0.0.0.0 for accessibility instead of localhost
const HOST = "0.0.0.0";
const PORT = parseInt(process.env.PORT || "5000", 10);

async function startServer() {
  try {
    // Register all API routes
    const server = await registerRoutes(app);

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }

    server.listen(PORT, HOST, () => {
      log(`🚀 Server running on http://${HOST}:${PORT}`);
      
      if (process.env.NODE_ENV === "production") {
        log("📦 Serving static files from dist/public");
      } else {
        log("🔥 Development mode with Vite HMR");
      }
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();