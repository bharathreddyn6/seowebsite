import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWebsiteAnalysisSchema, insertRankingHistorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Analyze website endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { url } = insertWebsiteAnalysisSchema.parse(req.body);
      
      // Simulate SEO analysis (in production, this would call real SEO APIs)
      const analysisResult = await simulateWebsiteAnalysis(url);
      
      const analysis = await storage.createWebsiteAnalysis(analysisResult);
      
      // Create initial ranking history entries
      const metrics = ['overall', 'seo', 'brand', 'social', 'performance'];
      for (const metric of metrics) {
        await storage.createRankingHistory({
          websiteAnalysisId: analysis.id,
          metric,
          value: getScoreForMetric(analysisResult, metric),
          change: 0, // First analysis has no change
        });
      }
      
      res.json(analysis);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid request" 
      });
    }
  });

  // Get recent analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const analyses = await storage.getRecentAnalyses(limit);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch analyses" 
      });
    }
  });

  // Get ranking trends
  app.get("/api/trends/:metric", async (req, res) => {
    try {
      const { metric } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const trends = await storage.getRankingTrends(metric, days);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch ranking trends" 
      });
    }
  });

  // Export data endpoint
  app.get("/api/export/:format", async (req, res) => {
    try {
      const { format } = req.params;
      const analyses = await storage.getRecentAnalyses(100);
      
      if (format === 'csv') {
        const csv = convertToCSV(analyses);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=rankings-export.csv');
        res.send(csv);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=rankings-export.json');
        res.json(analyses);
      } else {
        res.status(400).json({ message: "Invalid export format" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to export data" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Simulate website analysis (replace with real SEO API calls in production)
async function simulateWebsiteAnalysis(url: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate realistic scores based on URL analysis
  const baseScore = Math.floor(Math.random() * 30) + 70; // 70-100 range
  
  return {
    url,
    overallScore: baseScore,
    seoScore: Math.min(100, baseScore + Math.floor(Math.random() * 10) - 5),
    brandScore: Math.min(100, baseScore + Math.floor(Math.random() * 15) - 10),
    socialScore: Math.min(100, baseScore + Math.floor(Math.random() * 20) - 10),
    performanceScore: Math.min(100, baseScore + Math.floor(Math.random() * 10) - 5),
    metrics: {
      pageSpeed: Math.floor(Math.random() * 20) + 80,
      mobileScore: Math.floor(Math.random() * 10) + 90,
      security: Math.floor(Math.random() * 5) + 95,
      userExperience: Math.floor(Math.random() * 15) + 85,
    },
    keywords: [
      { keyword: "javascript framework", rank: 2, change: 2 },
      { keyword: "web development", rank: 5, change: -1 },
      { keyword: "frontend tools", rank: 1, change: 0 },
      { keyword: "react development", rank: 3, change: 1 },
    ],
    competitors: [
      { domain: "competitor1.com", position: "above" },
      { domain: "competitor2.com", position: "below" },
      { domain: "competitor3.com", position: "below" },
    ],
  };
}

function getScoreForMetric(analysis: any, metric: string): number {
  switch (metric) {
    case 'overall': return analysis.overallScore;
    case 'seo': return analysis.seoScore;
    case 'brand': return analysis.brandScore;
    case 'social': return analysis.socialScore;
    case 'performance': return analysis.performanceScore;
    default: return 0;
  }
}

function convertToCSV(analyses: any[]): string {
  if (analyses.length === 0) return '';
  
  const headers = ['URL', 'Overall Score', 'SEO Score', 'Brand Score', 'Social Score', 'Performance Score', 'Created At'];
  const rows = analyses.map(analysis => [
    analysis.url,
    analysis.overallScore,
    analysis.seoScore,
    analysis.brandScore,
    analysis.socialScore,
    analysis.performanceScore,
    analysis.createdAt.toISOString(),
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
