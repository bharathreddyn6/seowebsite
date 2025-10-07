import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";
import { z } from "zod";

// ✅ Load API keys from environment variables
const NEWS_API_KEY = process.env.NEWS_API_KEY!;
const GOOGLE_SAFE_BROWSING_KEY = process.env.GOOGLE_SAFE_BROWSING_KEY!;

// Schema for analyzing request
const analyzeSchema = z.object({
  url: z.string().url(),
});

// Register routes
export async function registerRoutes(app: Express): Promise<Server> {
  /**
   * Brand Ranking API
   * POST /api/brand-ranking
   */
  app.post("/api/brand-ranking", async (req, res) => {
    try {
      const { url } = analyzeSchema.parse(req.body);

      // Extract domain from URL
      const domain = new URL(url).hostname;

      // --- 1) Brand mentions from Google Custom Search API ---
      let mentions = 0;
      try {
        const searchRes = await fetch(
          `https://www.googleapis.com/customsearch/v1?q=${domain}&key=${process.env.GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=a570c2bdbff5546de`
        );
        const searchData = (await searchRes.json()) as {
          searchInformation?: { totalResults?: string };
        };
        mentions = searchData?.searchInformation?.totalResults
          ? parseInt(searchData.searchInformation.totalResults)
          : 0;
      } catch (e) {
        mentions = 0;
      }
      // --- 2) Domain Authority from OpenPageRank (free) ---
      let domainAuthority = 0;

      try {
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
      } catch (e) {
        domainAuthority = 0;
      }
      // --- 3) Trust Score using Google Safe Browsing ---
      let trustScore = 100;
      try {
        const safeRes = await fetch(
          `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client: { clientId: "seo-app", clientVersion: "1.0" },
              threats: {
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
          trustScore = 40; // lower trust if flagged
        }
      } catch (e) {
        trustScore = 70;
      }


      // --- 4) Brand Score (weighted average) ---
      const brandScore = Math.min(
        100,
        Math.round((mentions / 100 + domainAuthority + trustScore) / 3)
      );

      // ✅ Final JSON Response
      res.json({
        url,
        domain,
        brandScore,
        brandMentions: mentions,
        domainAuthority,
        trustScore,
      });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Invalid request",
      });
    }
  });
  
  // Keep your old endpoints (SEO, analyses, export, etc.)
  // ... (leave them as they are in your file)

  const httpServer = createServer(app);
  return httpServer;

}
