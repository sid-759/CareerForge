import express from "express";
import path from "path";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import apiRouter from "./server/routes.js";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Validate required environment variables
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "FATAL: JWT_SECRET is not configured or is too short. " +
      "Set JWT_SECRET to a strong random string of at least 32 characters via environment variables."
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "FATAL: GEMINI_API_KEY is not configured. " +
      "Set GEMINI_API_KEY via environment variables. Get your key from: https://aistudio.google.com/app/apikey"
    );
  }

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  
  // Security headers middleware
  app.use((req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Prevent clickjacking attacks
    res.setHeader("X-Frame-Options", "DENY");
    // Control referrer information
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Restrict browser features
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    // Prevent browser MIME sniffing for XSS
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // HSTS for HTTPS connections (production only)
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  // Rate limiting middleware
  const requestCounts = new Map();
  const CLEANUP_INTERVAL = 60 * 1000; // Clean up old entries every minute
  
  // Periodic cleanup of old rate limit entries
  setInterval(() => {
    const now = Date.now();
    const oneminute = 60 * 1000;
    for (const [key, data] of requestCounts.entries()) {
      if (now - data.startedAt > oneminute) {
        requestCounts.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  
  app.use("/api", (req, res, next) => {
    const windowMs = 60 * 1000; // 60 second window
    const isAuthEndpoint = req.path.startsWith("/auth/");
    const maxRequests = isAuthEndpoint ? 20 : 100; // Stricter for auth endpoints
    const key = `${req.ip}:${isAuthEndpoint ? "auth" : "api"}`;
    const now = Date.now();
    const current = requestCounts.get(key);
    
    if (!current || now - current.startedAt >= windowMs) {
      requestCounts.set(key, { startedAt: now, count: 1 });
      return next();
    }
    
    current.count += 1;
    if (current.count > maxRequests) {
      return res.status(429).json({ 
        error: "Too many requests. Please try again shortly.",
        retryAfter: Math.ceil((current.startedAt + windowMs - now) / 1000)
      });
    }
    next();
  });

  // Add standard middlewares
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  // Mount backend endpoints
  app.use("/api", apiRouter);

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Serve Frontend with Vite Middleware in Dev or static files in Production
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite development server mode enabled.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Production compiled build asset serving mode.");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files
    app.use(express.static(distPath));
    
    // Fallback all other routes to index.html for React Router DOM
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not found." });
  });

  // Global error handling middleware (must be last)
  app.use((err, req, res, next) => {
    // Don't send error if response already sent
    if (res.headersSent) {
      return;
    }
    
    // Log error for debugging
    console.error("Unhandled error:", {
      message: err?.message,
      code: err?.code,
      status: err?.statusCode,
      stack: process.env.NODE_ENV !== "production" ? err?.stack : undefined
    });

    // Handle specific error types
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Uploaded file exceeds the size limit." });
    }
    
    if (err?.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: "Unexpected file upload." });
    }
    
    if (err?.code === "LIMIT_PART_COUNT") {
      return res.status(400).json({ error: "Too many file parts." });
    }
    
    if (err?.code === "LIMIT_FIELD_KEY") {
      return res.status(400).json({ error: "Field key too large." });
    }
    
    if (err?.code === "LIMIT_FIELD_VALUE") {
      return res.status(400).json({ error: "Field value too large." });
    }

    // Use status code from error if available and valid, otherwise 500
    const statusCode = (err?.statusCode >= 400 && err?.statusCode < 600) ? err.statusCode : 500;
    
    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === "production";
    const errorMessage = isProduction 
      ? "An error occurred while processing your request."
      : (err?.message || "Internal server error.");

    return res.status(statusCode).json({ error: errorMessage });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CareerForge backend + asset engine running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Bootstrapping server failed:", err);
});
