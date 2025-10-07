import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import { serveStatic, log } from "./vite";
import { connectMongo } from "./db";
import { authRouter } from "./auth";

const app = express();
app.use(express.json());
// Configure CORS to allow the frontend to send credentials (cookies) and reflect the origin.
// If FRONTEND_ORIGIN is set in .env, allow only that origin; otherwise reflect the request origin.
{
  const cors = (await import("cors")).default;
  const frontend = process.env.FRONTEND_ORIGIN || undefined;
  const corsOptions: any = {
    credentials: true,
  };
  if (frontend) {
    corsOptions.origin = frontend;
  } else {
    // reflect the request origin (not wildcard) so Access-Control-Allow-Credentials can be true
    corsOptions.origin = true;
  }
  app.use(cors(corsOptions));
}
app.use(express.urlencoded({ extended: false }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

(async () => {
  // Ensure MongoDB connection (will warn and skip if no MONGODB_URI is set)
  await connectMongo().catch((err) => {
    console.error("Failed to connect MongoDB:", err?.message);
  });

  // Routers
  app.use("/api/auth", authRouter);
  await registerRoutes(app);

  const server = createServer(app);

  // Serve static client if build exists
  try {
    serveStatic(app);
  } catch (err) {
    log("No client build found; skipping static serve", "express");
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";
  const listenOptions: any = { port, host };
  // reusePort is not supported on Windows; enabling it there causes ENOTSUP
  if (process.platform !== "win32") {
    (listenOptions as any).reusePort = true;
  }

  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
})();
