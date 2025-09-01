// This file contains mock data structure definitions for type safety
// In production, this data would come from real APIs

export interface MetricData {
  overallScore: number;
  seoScore: number;
  brandScore: number;
  socialScore: number;
  performanceScore: number;
  metrics: {
    pageSpeed: number;
    mobileScore: number;
    security: number;
    userExperience: number;
  };
  keywords: Array<{
    keyword: string;
    rank: number;
    change: number;
    category: string;
  }>;
  competitors: Array<{
    domain: string;
    position: "above" | "below";
  }>;
}

export interface TrendData {
  date: string;
  value: number;
  metric: string;
}

export interface RecentChange {
  title: string;
  time: string;
  type: "improvement" | "decline" | "update";
}

// Type definitions for better TypeScript support
export type RankingCategory = "all" | "seo" | "brand" | "social" | "performance";
export type TimePeriod = "7" | "30" | "90";
export type TrendDirection = "up" | "down" | "stable";
