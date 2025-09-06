import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use((await import("cors")).default());
app.use(express.urlencoded({ extended: false }));

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

  // if build exists, serve static client
  try {
    serveStatic(app);
  } catch (e) {
    // ignore if no build
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
