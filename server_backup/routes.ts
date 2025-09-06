// server/routes.ts
import { Express } from "express";
import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import http from "http";

export async function registerRoutes(app: Express) {
  const router = express.Router();

  // simple analyses list used by frontend invalidation
  router.get("/analyses", (_req, res) => res.json([]));

  // POST /api/analyze
  router.post("/analyze", async (req, res) => {
    try {
      let { url } = req.body || {};
      if (!url || typeof url !== "string") {
        return res.status(400).json({ message: "url is required" });
      }

      // normalize
      if (!/^https?:\/\//i.test(url)) url = "http://" + url;

      const resp = await axios.get(url, { timeout: 15000 });
      const $ = cheerio.load(resp.data || "");

      const title = $("title").text() || null;
      const metaDescription = $('meta[name="description"]').attr("content") || null;
      const h1Count = $("h1").length;
      const imagesTotal = $("img").length;
      const imagesWithAlt = $("img[alt]").length;
      const wordCount = (resp.data ? resp.data.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length : 0);

      const seoScore = Math.max(
        0,
        Math.round(
          100 -
            (title ? 0 : 10) -
            (metaDescription ? 0 : 10) -
            Math.max(0, imagesTotal - imagesWithAlt) * 2
        )
      );

      const analysis = {
        url,
        title,
        metaDescription,
        h1Count,
        imagesTotal,
        imagesWithAlt,
        wordCount,
        seoScore,
      };

      // Return both top-level url and analysis object (frontend expects url)
      return res.json({ url, analysis });
    } catch (err: any) {
      console.error("Analyze error:", err?.message || err);
      return res.status(500).json({ message: "Failed to analyze site", detail: err?.message });
    }
  });

  app.use("/api", router);

  // create and return http server (index.ts expects registerRoutes to return a server)
  const server = http.createServer(app);
  return server;
}
