import { type User, type InsertUser, type WebsiteAnalysis, type InsertWebsiteAnalysis, type RankingHistory, type InsertRankingHistory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Website Analysis methods
  getWebsiteAnalysis(id: string): Promise<WebsiteAnalysis | undefined>;
  getWebsiteAnalysesByUrl(url: string): Promise<WebsiteAnalysis[]>;
  createWebsiteAnalysis(analysis: InsertWebsiteAnalysis): Promise<WebsiteAnalysis>;
  getRecentAnalyses(limit?: number): Promise<WebsiteAnalysis[]>;
  
  // Ranking History methods
  getRankingHistory(websiteAnalysisId: string): Promise<RankingHistory[]>;
  createRankingHistory(history: InsertRankingHistory): Promise<RankingHistory>;
  getRankingTrends(metric: string, days?: number): Promise<RankingHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private websiteAnalyses: Map<string, WebsiteAnalysis>;
  private rankingHistory: Map<string, RankingHistory>;

  constructor() {
    this.users = new Map();
    this.websiteAnalyses = new Map();
    this.rankingHistory = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getWebsiteAnalysis(id: string): Promise<WebsiteAnalysis | undefined> {
    return this.websiteAnalyses.get(id);
  }

  async getWebsiteAnalysesByUrl(url: string): Promise<WebsiteAnalysis[]> {
    return Array.from(this.websiteAnalyses.values()).filter(
      (analysis) => analysis.url === url
    );
  }

  async createWebsiteAnalysis(insertAnalysis: InsertWebsiteAnalysis): Promise<WebsiteAnalysis> {
    const id = randomUUID();
    const analysis: WebsiteAnalysis = {
      ...insertAnalysis,
      id,
      metrics: insertAnalysis.metrics || null,
      keywords: insertAnalysis.keywords || null,
      competitors: insertAnalysis.competitors || null,
      createdAt: new Date(),
    };
    this.websiteAnalyses.set(id, analysis);
    return analysis;
  }

  async getRecentAnalyses(limit = 10): Promise<WebsiteAnalysis[]> {
    return Array.from(this.websiteAnalyses.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getRankingHistory(websiteAnalysisId: string): Promise<RankingHistory[]> {
    return Array.from(this.rankingHistory.values()).filter(
      (history) => history.websiteAnalysisId === websiteAnalysisId
    );
  }

  async createRankingHistory(insertHistory: InsertRankingHistory): Promise<RankingHistory> {
    const id = randomUUID();
    const history: RankingHistory = {
      ...insertHistory,
      id,
      date: new Date(),
    };
    this.rankingHistory.set(id, history);
    return history;
  }

  async getRankingTrends(metric: string, days = 30): Promise<RankingHistory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Array.from(this.rankingHistory.values())
      .filter((history) => history.metric === metric && history.date >= cutoffDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

export const storage = new MemStorage();
