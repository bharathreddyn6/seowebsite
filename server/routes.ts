import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { z } from "zod";
import AnalysisModel from "./models/Analysis";

// ========================================
// ENVIRONMENT VARIABLES
// ========================================
const NEWS_API_KEY = process.env.NEWS_API_KEY!;
const GOOGLE_SAFE_BROWSING_KEY = process.env.GOOGLE_SAFE_BROWSING_KEY!;
const BRAND_SCORE_API_KEY = process.env.BRAND_SCORE;
const PAGESPEED_KEY = process.env.PAGESPEED_KEY || process.env.CRUX_API_KEY || process.env.VITE_CRUX_API_KEY;
const CRUX_API_KEY = process.env.CRUX_API_KEY;
const UPTIMEROBOT_API_KEY = process.env.UPTIMEROBOT_API_KEY;

// ========================================
// SCHEMAS
// ========================================
const analyzeSchema = z.object({
  url: z.string().url(),
});

// ========================================
// IN-MEMORY STORAGE & RATE LIMITING
// ========================================
const analyses: any[] = [];
const performanceAnalyses: any[] = [];
const rateWindowMs = 60_000; // 1 minute
const maxRequestsPerWindow = 12;
const ipTimestamps = new Map<string, number[]>();

// ========================================
// UTILITY FUNCTIONS
// ========================================
function scoreRange(val: number, max = 100) {
  return Math.max(0, Math.min(Math.round(val), max));
}

// ========================================
// PAGESPEED INSIGHTS FUNCTION
// ========================================
async function computePerformance(url: string) {
  let performanceScore = 0;
  let lcp = 0, fid = 0, cls = 0, fcp = 0;
  let pageLoadTime = 0;

  // If no API key, return mock data
  if (!PAGESPEED_KEY) {
    console.warn("⚠️ No PageSpeed API key found, returning mock data");
    return {
      performanceScore: 85,
      pageLoadTime: 2.3,
      coreWebVitals: { LCP: 1800, FID: 45, CLS: 0.08, FCP: 1200 },
    };
  }

  try {
    const encoded = encodeURIComponent(url);
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encoded}&key=${PAGESPEED_KEY}&strategy=mobile`;
    
    console.log("🔍 Calling PageSpeed Insights API for:", url);
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000); // 90s timeout
    
    let resp: any;
    try {
      resp = await fetch(psiUrl, { 
        redirect: "follow",
        signal: controller.signal as any
      });
    } finally {
      clearTimeout(timer);
    }
    
    if (!resp.ok) {
      throw new Error(`PageSpeed API error: ${resp.status}`);
    }
    
    const data: any = await resp.json();
    const lighthouse = data.lighthouseResult;

    if (lighthouse) {
      // Get performance score
      performanceScore = Math.round((lighthouse.categories?.performance?.score ?? 0) * 100);
      
      // Get page load time from speed-index
      const speedIndex = lighthouse.audits?.["speed-index"]?.numericValue;
      pageLoadTime = speedIndex ? Math.round(speedIndex) / 1000 : 0;

      // Get Core Web Vitals from metrics
      const metrics = lighthouse.audits?.["metrics"]?.details?.items?.[0] ?? {};
      
      lcp = Math.round(metrics.largestContentfulPaint ?? metrics["largest-contentful-paint"] ?? 0);
      fcp = Math.round(metrics.firstContentfulPaint ?? metrics["first-contentful-paint"] ?? 0);
      fid = Math.round(metrics.totalBlockingTime ?? metrics["total-blocking-time"] ?? 0);
      cls = parseFloat((metrics.cumulativeLayoutShift ?? metrics["cumulative-layout-shift"] ?? 0).toFixed(3));

      console.log("✅ PageSpeed data retrieved:", { performanceScore, pageLoadTime, lcp, fid, cls });
    }
  } catch (err: any) {
    console.warn("❌ computePerformance failed:", err.message);
    
    // Return basic defaults on error
    return {
      performanceScore: 0,
      pageLoadTime: 0,
      coreWebVitals: { LCP: 0, FID: 0, CLS: 0, FCP: 0 },
    };
  }

  return {
    performanceScore: scoreRange(performanceScore),
    pageLoadTime: parseFloat(pageLoadTime.toFixed(2)),
    coreWebVitals: { 
      LCP: lcp, 
      FID: fid, 
      CLS: cls,
      FCP: fcp
    },
  };
}

// ========================================
// UPTIMEROBOT FUNCTION
// ========================================
async function getUptimeData(url: string): Promise<string> {
  if (!UPTIMEROBOT_API_KEY) {
    console.warn("⚠️ No UptimeRobot API key found, returning default uptime");
    return "99.9";
  }

  try {
    console.log("🔍 Fetching uptime data from UptimeRobot...");
    
    // Extract domain from URL for matching
    const domain = new URL(url).hostname;
    
    const uptimeRes = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify({ 
        api_key: UPTIMEROBOT_API_KEY, 
        format: "json",
        logs: 0 // Don't need logs, just status
      }),
    });

    if (!uptimeRes.ok) {
      throw new Error(`UptimeRobot API error: ${uptimeRes.status}`);
    }

    const uptimeData: any = await uptimeRes.json();
    
    if (uptimeData.stat !== "ok") {
      throw new Error(`UptimeRobot API returned error: ${uptimeData.error?.message || "Unknown error"}`);
    }

    const monitors = uptimeData.monitors || [];
    
    if (monitors.length === 0) {
      console.warn("⚠️ No monitors found in UptimeRobot");
      return "99.9";
    }

    // Try to find monitor matching the domain
    let monitor = monitors.find((m: any) => 
      m.url && (m.url.includes(domain) || m.friendly_name?.includes(domain))
    );

    // If no match, use first monitor
    if (!monitor && monitors.length > 0) {
      monitor = monitors[0];
      console.log(`📊 No exact match for ${domain}, using first monitor: ${monitor.friendly_name}`);
    }

    const uptimeRatio = monitor?.all_time_uptime_ratio || monitor?.custom_uptime_ratio || "99.9";
    console.log("✅ Uptime data retrieved:", uptimeRatio);
    
    return uptimeRatio.toString();
  } catch (err: any) {
    console.error("❌ UptimeRobot error:", err.message);
    return "99.9"; // Default fallback
  }
}

// ========================================
// SEO SCORE COMPUTATION
// ========================================
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

  if (BRAND_SCORE_API_KEY && BRAND_SCORE_API_KEY !== "your_brand_score_api_key_here") {
    try {
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

  let psiMetrics: any = null;
  if (PAGESPEED_KEY) {
    try {
      const encoded = encodeURIComponent(info.url);
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encoded}&key=${PAGESPEED_KEY}&strategy=mobile`;
      const resp = await fetch(psiUrl, { redirect: "follow" });
      if (resp.ok) {
        const json: any = await resp.json();
        const audits = json.lighthouseResult?.audits;
        const metrics = audits?.["metrics"]?.details?.items?.[0] || null;
        const lcp = metrics?.["largest-contentful-paint"] || metrics?.["largestContentfulPaint"] || null;
        const fcp = metrics?.["first-contentful-paint"] || metrics?.["firstContentfulPaint"] || null;
        const ttfb = audits?.["server-response-time"]?.numericValue || null;
        const performanceScore = Math.round((json.lighthouseResult?.categories?.performance?.score || 0) * 100);

        if (typeof performanceScore === "number" && performanceScore > 0) {
          perf = performanceScore;
        } else if (lcp) {
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

// ========================================
// REGISTER ROUTES
// ========================================
export async function registerRoutes(app: Express): Promise<Server> {
  
  // ========================================
  // HEALTH CHECK
  // ========================================
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      hasPageSpeedKey: !!PAGESPEED_KEY,
      hasUptimeRobotKey: !!UPTIMEROBOT_API_KEY,
      hasGoogleSearchKey: !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
      hasOpenPageRankKey: !!process.env.OPENPAGERANK_API_KEY,
    });
  });

  // ========================================
  // BRAND RANKING API
  // ========================================
  
  /**
   * Brand Ranking API
   * POST /api/brand-ranking
   */
  app.post("/api/brand-ranking", async (req, res) => {
    console.log("📊 Brand Ranking request received:", req.body);
    try {
      const { url } = analyzeSchema.parse(req.body);
      console.log("✅ URL validated:", url);

      const domain = new URL(url).hostname;
      console.log("🌐 Domain extracted:", domain);

      // --- 1) Brand mentions from Google Custom Search API ---
      let mentions = 0;
      try {
        console.log("🔍 Fetching brand mentions...");
        const searchRes = await fetch(
          `https://www.googleapis.com/customsearch/v1?q=${domain}&key=${process.env.GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=a570c2bdbff5546de`
        );
        const searchData = (await searchRes.json()) as {
          searchInformation?: { totalResults?: string };
        };
        mentions = searchData?.searchInformation?.totalResults
          ? parseInt(searchData.searchInformation.totalResults)
          : 0;
        console.log("✅ Brand mentions:", mentions);
      } catch (e) {
        console.error("❌ Brand mentions error:", e);
        mentions = 0;
      }

      // --- 2) Domain Authority from OpenPageRank (free) ---
      let domainAuthority = 0;
      try {
        console.log("📈 Fetching domain authority...");
        const daRes = await fetch(
          `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${domain}`,
          {
            headers: { "API-OPR": process.env.OPENPAGERANK_API_KEY || "" },
          }
        );
        const daData = (await daRes.json()) as {
          response?: Array<{ page_rank_integer?: number }>;
        };
        domainAuthority =
          daData.response && daData.response[0]?.page_rank_integer !== undefined
            ? daData.response[0].page_rank_integer
            : 0;
        console.log("✅ Domain authority:", domainAuthority);
      } catch (e) {
        console.error("❌ Domain authority error:", e);
        domainAuthority = 0;
      }

      // --- 3) Trust Score using Google Safe Browsing ---
      let trustScore = 100;
      try {
        console.log("🔒 Checking trust score...");
        const safeRes = await fetch(
          `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client: { clientId: "seo-app", clientVersion: "1.0" },
              threatInfo: {
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatTypes: [
                  "MALWARE",
                  "SOCIAL_ENGINEERING",
                  "UNWANTED_SOFTWARE",
                  "POTENTIALLY_HARMFUL_APPLICATION",
                ],
                threatEntries: [{ url }],
              },
            }),
          }
        );
        const safeData = (await safeRes.json()) as { matches?: Array<any> };
        if (safeData.matches && safeData.matches.length > 0) {
          trustScore = 40;
        }
        console.log("✅ Trust score:", trustScore);
      } catch (e) {
        console.error("❌ Trust score error:", e);
        trustScore = 70;
      }

      // --- 4) Brand Score (weighted average) ---
      const brandScore = Math.min(
        100,
        Math.round((mentions / 100 + domainAuthority + trustScore) / 3)
      );

      console.log("🎯 Final brand score:", brandScore);

      const response = {
        url,
        domain,
        brandScore,
        brandMentions: mentions,
        domainAuthority,
        trustScore,
      };
      
      console.log("📤 Sending response:", response);
      res.json(response);
    } catch (error) {
      console.error("💥 Brand ranking error:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Invalid request",
        error: error instanceof Error ? error.stack : undefined,
      });
    }
  });

  // ========================================
  // PERFORMANCE API
  // ========================================
  
  /**
   * Website Performance API
   * POST /api/performance
   */
  app.post("/api/performance", async (req: Request, res: Response) => {
    console.log("⚡ Performance request received:", req.body);
    try {
      const { url } = req.body || {};
      
      if (!url || typeof url !== "string") {
        console.log("❌ Invalid URL provided");
        return res.status(400).json({ message: "Invalid request: url is required" });
      }

      // Validate URL format
      try {
        new URL(url.startsWith('http') ? url : `https://${url}`);
      } catch (e) {
        console.log("❌ Invalid URL format:", e);
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Rate limiting per IP
      const ip = (req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown") as string;
      const now = Date.now();
      const arr = ipTimestamps.get(ip) || [];
      const windowed = arr.filter((t) => t > now - rateWindowMs);
      
      if (windowed.length >= maxRequestsPerWindow) {
        console.log("⚠️ Rate limit exceeded for IP:", ip);
        return res.status(429).json({ 
          message: "Too many requests. Please try again in a minute." 
        });
      }
      
      windowed.push(now);
      ipTimestamps.set(ip, windowed);

      // Ensure URL has protocol
      let targetUrl = url;
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "https://" + targetUrl;
      }

      console.log("🔍 Computing performance for:", targetUrl);

      // Compute performance data (PageSpeed Insights)
      const perfData = await computePerformance(targetUrl);

      // Get uptime data (UptimeRobot)
      const uptime = await getUptimeData(targetUrl);

      // If performance score is 0, it's likely an analysis failure or timeout
      if (perfData.performanceScore === 0) {
        return res.status(504).json({
          message: "Analysis timed out. The URL may be too complex or is blocking requests. Please try again later."
        });
      }

      console.log("✅ Performance data computed:", perfData);
      console.log("✅ Uptime:", uptime);

      // Create analysis object
      const analysis = { 
        id: "p" + Date.now(),
        url: targetUrl, 
        ...perfData,
        uptime,
        createdAt: new Date(),
        timestamp: Date.now()
      };

      console.log("📦 Analysis object created");

      // Try to store in database
      try {
        if (AnalysisModel && typeof AnalysisModel.create === 'function') {
          console.log("💾 Saving to database...");
          const doc = await AnalysisModel.create(analysis);
          console.log("✅ Saved to database successfully");
          
          const result = {
            url: targetUrl,
            performanceScore: perfData.performanceScore,
            pageLoadTime: perfData.pageLoadTime,
            coreWebVitals: perfData.coreWebVitals,
            uptime,
            id: doc._id || doc.id,
            createdAt: doc.createdAt
          };
          
          return res.status(200).json(result);
        }
      } catch (dbErr: any) {
        console.warn("⚠️ DB save failed, using in-memory storage:", dbErr.message);
      }

      // Fallback to in-memory storage
      console.log("💾 Using in-memory storage");
      performanceAnalyses.unshift(analysis);
      if (performanceAnalyses.length > 100) {
        performanceAnalyses.length = 100; // Keep only last 100
      }
      
      const result = {
        url: targetUrl,
        performanceScore: perfData.performanceScore,
        pageLoadTime: perfData.pageLoadTime,
        coreWebVitals: perfData.coreWebVitals,
        uptime,
        id: analysis.id,
        createdAt: analysis.createdAt
      };
      
      console.log("📤 Returning analysis:", result);
      return res.status(200).json(result);

    } catch (err: any) {
      console.error("💥 Performance route error:", err);
      console.error("Stack:", err.stack);
      return res.status(500).json({ 
        message: "Failed to analyze performance", 
        detail: err?.message || "Unknown error"
      });
    }
  });

  /**
   * Get latest performance analysis
   * GET /api/performance/latest
   */
  app.get("/api/performance/latest", async (req: Request, res: Response) => {
    try {
      // Try database first
      if (AnalysisModel && typeof AnalysisModel.findOne === 'function') {
        const latest = await AnalysisModel.findOne()
          .sort({ createdAt: -1 })
          .lean();
        if (latest) {
          return res.json(latest);
        }
      }

      // Fallback to in-memory
      if (performanceAnalyses.length > 0) {
        return res.json(performanceAnalyses[0]);
      }

      return res.status(404).json({ 
        message: "No performance analyses found. Analyze a URL first." 
      });
    } catch (err: any) {
      console.error("Error fetching latest performance:", err);
      return res.status(500).json({ 
        message: "Error fetching performance data",
        detail: err?.message 
      });
    }
  });

  /**
   * Get all performance analyses
   * GET /api/performance
   */
  app.get("/api/performance", async (req: Request, res: Response) => {
    try {
      const hasPagination = typeof req.query.page !== "undefined" || typeof req.query.limit !== "undefined";
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
      const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "20", 10)));

      // Try database first
      if (AnalysisModel && typeof AnalysisModel.find === 'function') {
        if (hasPagination) {
          const total = await AnalysisModel.countDocuments();
          const items = await AnalysisModel.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
          return res.json({ total, page, limit, items });
        }

        const items = await AnalysisModel.find()
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        return res.json(items);
      }

      // Fallback to in-memory
      if (hasPagination) {
        const start = (page - 1) * limit;
        const items = performanceAnalyses.slice(start, start + limit);
        return res.json({ total: performanceAnalyses.length, page, limit, items });
      }

      return res.json(performanceAnalyses.slice(0, 50));
    } catch (err: any) {
      console.error("Error fetching performance analyses:", err);
      return res.status(500).json({ 
        message: "Error fetching analyses",
        detail: err?.message 
      });
    }
  });

  // ========================================
  // SEO ANALYSIS ROUTES
  // ========================================

  app.get("/api/analyses", async (req: Request, res: Response) => {
    const hasPagination = typeof req.query.page !== "undefined" || typeof req.query.limit !== "undefined";
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "20", 10)));

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

    return res.json(analyses.slice());
  });

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

      let backlinksEstimate = 0;
      try {
        const pageUrl = new URL(target);
        const anchors = $("a[href]");
        anchors.each((i, el) => {
          const href = $(el).attr("href");
          try {
            const u = new URL(href!, pageUrl.href);
            if (u.hostname !== pageUrl.hostname) backlinksEstimate += 1;
          } catch { }
        });
      } catch { backlinksEstimate = 0; }

      const issues = {
        missing_meta_descriptions: metaDescription ? 0 : 1,
        slow_loading_pages: responseTimeMs > 1000 ? 1 : 0,
        broken_internal_links: 0,
        missing_alt_tags: imagesTotal ? Math.max(0, imagesTotal - imagesWithAlt) : 0,
      };

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

      try {
        if (AnalysisModel && AnalysisModel.create) {
          const doc = await AnalysisModel.create(analysis as any);
          return res.json({ analysis: doc });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("Failed to persist analysis to DB, falling back to memory:", msg);
      }

      analyses.unshift(analysis);
      res.json({ analysis });
    } catch (err: any) {
      console.error("Analyze error:", err?.message);
      res.status(500).json({ message: "Failed to fetch or analyze the URL", detail: err?.message });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}