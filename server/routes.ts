import type { Express, Request, Response } from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import AnalysisModel from "./models/Analysis";

// In-memory store fallback when MongoDB is not connected
const analyses: any[] = [];

// Simple in-memory rate limiter by IP (sliding window)
const rateWindowMs = 60_000; // 1 minute
const maxRequestsPerWindow = 12;
const ipTimestamps = new Map<string, number[]>();

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

  let brand = (info.ogTitle || info.ogImage ? 70 : 50);
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
  // Basic perf estimation from responseTimeMs
  if (info.responseTimeMs) {
    if (info.responseTimeMs < 200) perf = 90;
    else if (info.responseTimeMs < 500) perf = 75;
    else if (info.responseTimeMs < 1000) perf = 60;
    else perf = 40;
  }
  if (info.totalBytes && info.totalBytes > 500000) perf -= 10;

  // If PageSpeed Insights API key is provided, try to get better performance metrics
  const PAGESPEED_KEY = process.env.PAGESPEED_KEY;
  let psiMetrics: any = null;
  if (PAGESPEED_KEY) {
    try {
      const encoded = encodeURIComponent(info.url);
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encoded}&key=${PAGESPEED_KEY}&strategy=mobile`;
      const resp = await fetch(psiUrl, { redirect: "follow" });
      if (resp.ok) {
  const json: any = await resp.json();
        // Extract some Lighthouse metrics if available
        const audits = json.lighthouseResult?.audits;
        const metrics = audits?.["metrics"]?.details?.items?.[0] || null;
        const lcp = metrics?.["largest-contentful-paint"] || metrics?.["largestContentfulPaint"] || null;
        const fcp = metrics?.["first-contentful-paint"] || metrics?.["firstContentfulPaint"] || null;
        const ttfb = audits?.["server-response-time"]?.numericValue || null;
        const performanceScore = Math.round((json.lighthouseResult?.categories?.performance?.score || 0) * 100);

        if (typeof performanceScore === "number" && performanceScore > 0) {
          perf = performanceScore;
        } else if (lcp) {
          // crude mapping: lower LCP -> higher perf
          const lcpMs = Number(lcp);
          if (!Number.isNaN(lcpMs)) {
            if (lcpMs < 2500) perf = Math.max(perf, 85);
            else if (lcpMs < 4000) perf = Math.max(perf, 70);
            else perf = Math.max(perf, 50);
          }
        }

        psiMetrics = { lcp: lcp ?? null, fcp: fcp ?? null, ttfb: ttfb ?? null, performanceScore };
      }
    } catch (e) {
      // ignore PSI failures
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("PageSpeed Insights call failed:", msg);
    }
  }

  const overall = Math.round((seo + brand + social + perf) / 4);
  return {
    overallScore: scoreRange(overall),
    seoScore: scoreRange(seo),
    brandScore: scoreRange(brand),
    socialScore: scoreRange(social),
    performanceScore: scoreRange(perf),
    psiMetrics,
  };
}

export async function registerRoutes(app: Express) {
  // Return all past analyses
  app.get("/api/analyses", async (req: Request, res: Response) => {
    // if page/limit query provided, return paginated object
    const hasPagination = typeof req.query.page !== "undefined" || typeof req.query.limit !== "undefined";
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "20", 10)));

    // prefer DB if available
    try {
      const isDbReady = !!(AnalysisModel && AnalysisModel.find);
      if (isDbReady) {
        if (hasPagination) {
          const total = await AnalysisModel.countDocuments();
          const items = await AnalysisModel.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
          return res.json({ total, page, limit, items });
        }

        // no pagination requested: return full array (newest first)
        const items = await AnalysisModel.find().sort({ createdAt: -1 }).lean();
        return res.json(items);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("/api/analyses DB read failed, falling back to memory:", msg);
    }

    if (hasPagination) {
      const start = (page - 1) * limit;
      const items = analyses.slice(start, start + limit);
      return res.json({ total: analyses.length, page, limit, items });
    }

    // default: return array (newest first)
    return res.json(analyses.slice());
  });

  // Return the latest analysis (convenience endpoint for UI)
  app.get("/api/analyses/latest", async (req: Request, res: Response) => {
    try {
      if (AnalysisModel && AnalysisModel.findOne) {
        const doc = await AnalysisModel.findOne().sort({ createdAt: -1 }).lean();
        if (doc) return res.json(doc);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("/api/analyses/latest DB read failed, falling back to memory:", msg);
    }

    // fallback to in-memory store
    if (analyses.length > 0) return res.json(analyses[0]);
    return res.status(404).json({ message: "No analyses available" });
  });

  app.get("/api/trends/:type/:days", async (req: Request, res: Response) => {
    const { type, days } = req.params;
    const daysNum = Math.max(1, Math.min(365, parseInt(days, 10) || 7));
    try {
      if (AnalysisModel && AnalysisModel.aggregate) {
        const since = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);
        const pipeline: any[] = [
          { $match: { createdAt: { $gte: since } } },
          { $sort: { createdAt: 1 } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, avgScore: { $avg: `$${type}Score` } } },
          { $sort: { _id: 1 } },
        ];
        const data = await AnalysisModel.aggregate(pipeline);
        return res.json({ type, days: daysNum, data });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("Trends aggregation failed, falling back to empty:", msg);
    }
    res.json({ type, days: daysNum, data: [] });
  });

  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      const { url } = req.body || {};
      if (!url || typeof url !== "string") {
        return res.status(400).json({ message: "Invalid request: url is required" });
      }

      // Rate limit per IP
      const ip = (req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown") as string;
      const now = Date.now();
      const arr = ipTimestamps.get(ip) || [];
      const windowed = arr.filter((t) => t > now - rateWindowMs);
      if (windowed.length >= maxRequestsPerWindow) {
        return res.status(429).json({ message: "Too many requests, slow down" });
      }
      windowed.push(now);
      ipTimestamps.set(ip, windowed);

      let target = url;
      if (!/^https?:\/\//i.test(target)) target = "http://" + target;

      const start = Date.now();
      // Use AbortController to enforce timeout in a type-safe way
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      let resp: any;
      try {
        resp = await fetch(target, { redirect: "follow", signal: controller.signal as any });
      } finally {
        clearTimeout(timer);
      }
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
      const imagesWithAlt = $("img").filter((i, el) => {
        const alt = $(el).attr("alt");
        return typeof alt === "string" && alt.trim().length > 0;
      }).length;
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

      // simple keyword extractor: take top frequent words from body text (ignore stopwords)
      const bodyText = $("body").text().toLowerCase().replace(/[^a-z0-9\s]/g, " ");
      const stopwords = new Set([
        "the", "and", "a", "to", "of", "in", "is", "it", "you", "that", "for", "on", "with", "as", "are", "this", "be", "or", "by", "an", "from", "at", "we", "have"
      ]);
      const freq: Record<string, number> = {};
      for (const w of bodyText.split(/\s+/).filter(Boolean)) {
        if (w.length < 3 || stopwords.has(w)) continue;
        freq[w] = (freq[w] || 0) + 1;
      }
      const uniqueKeywordCount = Object.keys(freq).length;
      const keywords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([k, v], i) => ({ keyword: k, rank: Math.max(1, 100 - i), change: (i % 5) - 2 }));

      // estimate backlinks as external anchors on the page
      let backlinksEstimate = 0;
      try {
        const pageUrl = new URL(target);
        const anchors = $("a[href]");
        anchors.each((i, el) => {
          const href = $(el).attr("href");
          try {
            const u = new URL(href!, pageUrl.href);
            if (u.hostname !== pageUrl.hostname) backlinksEstimate += 1;
          } catch { /* ignore invalid hrefs */ }
        });
      } catch { backlinksEstimate = 0; }

      // basic issue counts
      const issues = {
        missing_meta_descriptions: metaDescription ? 0 : 1,
        slow_loading_pages: responseTimeMs > 1000 ? 1 : 0,
        broken_internal_links: 0, // advanced check could be added later
        missing_alt_tags: imagesTotal ? Math.max(0, imagesTotal - imagesWithAlt) : 0,
      };

      // KPIs: make organic traffic and keyword rankings based on page content
      const organicTrafficEstimate = Math.max(0, Math.round((wordCount / 100) + (uniqueKeywordCount * 1.2) + (scores.seoScore / 3)));
      const kpis = {
        seo_score: scores.seoScore,
        organic_traffic: organicTrafficEstimate,
        keyword_rankings: uniqueKeywordCount,
        backlinks: backlinksEstimate,
      };

      const analysis = {
        id: "a" + Date.now(),
        createdAt: new Date().toISOString(),
        ...info,
        ...scores,
        psi: scores.psiMetrics ?? null,
        keywords,
        issues,
        kpis,
      };

      // Persist to DB if available
      try {
        if (AnalysisModel && AnalysisModel.create) {
          const doc = await AnalysisModel.create(analysis as any);
          // return saved doc with _id
          return res.json({ analysis: doc });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("Failed to persist analysis to DB, falling back to memory:", msg);
      }

      // fallback: store it in memory
      analyses.unshift(analysis);

      res.json({ analysis });
    } catch (err: any) {
      console.error("Analyze error:", err?.message);
      res.status(500).json({ message: "Failed to fetch or analyze the URL", detail: err?.message });
    }
  });

  // get single analysis
  app.get("/api/analyses/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      if (AnalysisModel && AnalysisModel.findOne) {
        const doc = await AnalysisModel.findOne({ _id: id }).lean();
        if (doc) return res.json({ analysis: doc });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("analysis fetch by id failed:", msg);
    }
    const found = analyses.find((a) => a.id === id || a._id === id || String(a._id) === id);
    if (!found) return res.status(404).json({ message: "Not found" });
    res.json({ analysis: found });
  });
}
