// server/brand.ts
import { Router } from "express";
import axios from "axios";

const router = Router();

async function fetchNewsMentions(brand: string): Promise<number> {
  if (!process.env.NEWS_API_KEY) return 0;
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      brand,
    )}&pageSize=50&language=en&apiKey=${process.env.NEWS_API_KEY}`;
    const r = await axios.get(url);
    return Array.isArray(r.data.articles) ? r.data.articles.length : 0;
  } catch {
    return 0;
  }
}

async function fetchOpenPageRank(domain: string): Promise<number> {
  if (!process.env.OPENPAGERANK_API_KEY) return 0;
  try {
    const url = `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${encodeURIComponent(
      domain,
    )}`;
    const r = await axios.get(url, {
      headers: { "API-OPR": process.env.OPENPAGERANK_API_KEY },
    });
    return r.data?.response?.[0]?.page_rank_integer || 0;
  } catch {
    return 0;
  }
}

async function fetchSafeBrowsing(domain: string): Promise<number> {
  if (!process.env.GOOGLE_SAFE_BROWSING_KEY) return 60;
  try {
    const url = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_KEY}`;
    const body = {
      client: { clientId: "brand-analyzer", clientVersion: "1.0" },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION",
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [
          { url: domain.startsWith("http") ? domain : `http://${domain}` },
        ],
      },
    };
    const r = await axios.post(url, body);
    return r.data && Object.keys(r.data).length > 0 ? 20 : 90;
  } catch {
    return 60;
  }
}

router.post("/check", async (req, res) => {
  try {
    const { url, brand } = req.body;
    if (!url && !brand) {
      return res.status(400).json({ error: "Provide url or brand" });
    }

    let domain = "";
    try {
      domain = url ? new URL(url).hostname : brand;
    } catch {
      domain = brand || url;
    }
    const brandName = brand || domain;

    const [newsCount, oprRank, trustScore] = await Promise.all([
      fetchNewsMentions(brandName),
      fetchOpenPageRank(domain),
      fetchSafeBrowsing(domain),
    ]);

    const domainAuthority = Math.round((oprRank / 10) * 100);
    const mentionScore = Math.min(100, newsCount * 2);
    const brandScore = Math.round(
      domainAuthority * 0.5 + trustScore * 0.3 + mentionScore * 0.2,
    );

    res.json({
      brand: brandName,
      domain,
      brandScore,
      domainAuthority,
      trustScore,
      mentions: { news: newsCount },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal error" });
  }
});

export default router;
