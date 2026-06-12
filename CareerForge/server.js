import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import apiRouter from "./server/routes.js";

// Load Environment Variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add standard middlewares
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CareerForge backend + asset engine running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Bootstrapping server failed:", err);
});
