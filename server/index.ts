import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { connectMongo } from "./db";
import { authRouter } from "./auth";


const app = express();
app.use(express.json());
app.use((await import("cors")).default());
app.use(express.urlencoded({ extended: false }));
app.use("/api/auth", authRouter);

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

(async () => {
  await registerRoutes(app);
  const server = createServer(app);

  // if build exists, serve static client
  try {
    serveStatic(app);
  } catch (err) {
    log("No client build found; skipping static serve", "express");
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
