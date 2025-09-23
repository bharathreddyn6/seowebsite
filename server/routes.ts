import type { Express, Request, Response } from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

// In-memory store for analyses
const analyses: any[] = [];

function scoreRange(val: number, max = 100) {
  return Math.max(0, Math.min(Math.round(val), max));
}

async function computeScores(info: any) {
  const checks = {
    hasTitle: info.title ? 1 : 0,
    titleLenGood: info.title && info.title.length >= 10 && info.title.length <= 60 ? 1 : 0,
    hasMetaDesc: info.metaDescription ? 1 : 0,
    metaDescLenGood: info.metaDescription && info.metaDescription.length >= 50 && info.metaDescription.length <= 160 ? 1 : 0,
    hasH1: info.h1Count > 0 ? 1 : 0,
    imagesWithAltRatio: info.imagesTotal ? (info.imagesWithAlt / info.imagesTotal) : 1,
    hasViewport: info.hasViewport ? 1 : 0,
    hasCanonical: info.hasCanonical ? 1 : 0,
    wordCountScore: Math.min(1, info.wordCount / 3000),
  };

  const seo = (
    checks.hasTitle * 10 +
    checks.titleLenGood * 10 +
    checks.hasMetaDesc * 10 +
    checks.metaDescLenGood * 10 +
    checks.hasH1 * 10 +
    checks.imagesWithAltRatio * 10 +
    checks.hasViewport * 10 +
    checks.hasCanonical * 10 +
    checks.wordCountScore * 20
  );

  let brand = (info.ogTitle || info.ogImage ? 70 : 50) + (info.brandMentions ? 10 : 0);
  const BRAND_SCORE_API_KEY = process.env.BRAND_SCORE;

  if (BRAND_SCORE_API_KEY && BRAND_SCORE_API_KEY !== "your_brand_score_api_key_here") {
    try {
      // This is a placeholder API endpoint.
      // Replace with your actual brand score API.
      const brandScoreUrl = `https://api.brandscore.dev/v1/score?url=${encodeURIComponent(info.url)}`;
      const response = await fetch(brandScoreUrl, {
        headers: {
          'Authorization': `Bearer ${BRAND_SCORE_API_KEY}`
        }
      });

      if (response.ok) {
        const data: any = await response.json();
        if (typeof data.score === 'number') {
          brand = data.score;
        }
      }
    } catch (e) {
      console.error("Brand score API call failed, falling back to default calculation.", e);
    }
  }

  const social = (info.twitterCard || info.ogTitle ? 70 : 50);

  let perf = 70;
  if (info.responseTimeMs) {
    if (info.responseTimeMs < 200) perf = 90;
    else if (info.responseTimeMs < 500) perf = 75;
    else if (info.responseTimeMs < 1000) perf = 60;
    else perf = 40;
  }
  if (info.totalBytes && info.totalBytes > 500000) perf -= 10;

  const overall = Math.round((seo + brand + social + perf) / 4);
  return {
    overallScore: scoreRange(overall),
    seoScore: scoreRange(seo),
    brandScore: scoreRange(brand),
    socialScore: scoreRange(social),
    performanceScore: scoreRange(perf),
  };
}

export async function registerRoutes(app: Express) {
  // Return all past analyses
  app.get("/api/analyses", (_req: Request, res: Response) => {
    res.json(analyses);
  });

  app.get("/api/trends/:type/:days", (req: Request, res: Response) => {
    const { type, days } = req.params;
    res.json({
      type,
      days: parseInt(days, 10) || 7,
      data: [], // you can fill this later with trend data
    });
  });

  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      const { url } = req.body || {};
      if (!url || typeof url !== "string") {
        return res.status(400).json({ message: "Invalid request: url is required" });
      }

      let target = url;
      if (!/^https?:\/\//i.test(target)) target = "http://" + target;

      const start = Date.now();
      const resp = await fetch(target, { redirect: "follow", timeout: 15000 });
      const responseTimeMs = Date.now() - start;

      const status = resp.status;
      const headers = Object.fromEntries(resp.headers.entries());
      const buffer = await resp.arrayBuffer();
      const totalBytes = buffer.byteLength;
      let html = "";
      try {
        html = Buffer.from(buffer).toString("utf-8");
      } catch {
        html = "";
      }

      const $ = cheerio.load(html || "");

      const title = $("head > title").text().trim() || null;
      const metaDescription = $('meta[name="description"]').attr("content") || null;
      const h1Count = $("h1").length;
      const imagesTotal = $("img").length;
      const imagesWithAlt = $("img").filter((i, el) => $(el).attr("alt")?.trim().length > 0).length;
      const hasViewport = !!$('meta[name="viewport"]').attr("content");
      const hasCanonical = !!$('link[rel="canonical"]').attr("href");
      const ogTitle = $('meta[property="og:title"]').attr("content") || null;
      const ogImage = $('meta[property="og:image"]').attr("content") || null;
      const twitterCard = $('meta[name="twitter:card"]').attr("content") || null;
      const wordCount = $("body").text().split(/\s+/).filter(Boolean).length;

      const info = {
        url: target,
        status,
        responseTimeMs,
        totalBytes,
        title,
        metaDescription,
        h1Count,
        imagesTotal,
        imagesWithAlt,
        hasViewport,
        hasCanonical,
        ogTitle,
        ogImage,
        twitterCard,
        wordCount,
        headers,
      };

      const scores = await computeScores(info);

      const analysis = {
        id: "a" + Date.now(),
        createdAt: new Date().toISOString(),
        ...info,
        ...scores,
      };

      // Store it in memory
      analyses.unshift(analysis);

      res.json({ analysis });
    } catch (err: any) {
      console.error("Analyze error:", err?.message);
      res.status(500).json({ message: "Failed to fetch or analyze the URL", detail: err?.message });
    }
  });
}
