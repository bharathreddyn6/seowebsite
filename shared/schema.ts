import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const websiteAnalyses = pgTable("website_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  overallScore: integer("overall_score").notNull(),
  seoScore: integer("seo_score").notNull(),
  brandScore: integer("brand_score").notNull(),
  socialScore: integer("social_score").notNull(),
  performanceScore: integer("performance_score").notNull(),
  metrics: jsonb("metrics"),
  keywords: jsonb("keywords"),
  competitors: jsonb("competitors"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rankingHistory = pgTable("ranking_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteAnalysisId: varchar("website_analysis_id").notNull(),
  metric: text("metric").notNull(), // 'overall', 'seo', 'brand', 'social', 'performance'
  value: integer("value").notNull(),
  change: integer("change").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWebsiteAnalysisSchema = createInsertSchema(websiteAnalyses).omit({
  id: true,
  createdAt: true,
}).extend({
  url: z.string().url("Please enter a valid URL"),
});

export const insertRankingHistorySchema = createInsertSchema(rankingHistory).omit({
  id: true,
  date: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWebsiteAnalysis = z.infer<typeof insertWebsiteAnalysisSchema>;
export type WebsiteAnalysis = typeof websiteAnalyses.$inferSelect;
export type InsertRankingHistory = z.infer<typeof insertRankingHistorySchema>;
export type RankingHistory = typeof rankingHistory.$inferSelect;
