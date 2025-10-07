import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import URLAnalyzer from "@/components/dashboard/url-analyzer";
import FilterBar from "@/components/dashboard/filter-bar";
import MetricCard from "@/components/dashboard/metric-card";
import RankingTrendsChart from "@/components/dashboard/ranking-trends-chart";
import DetailedRankingsTable from "@/components/dashboard/detailed-rankings-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SEORankings() {
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [selectedCategory, setSelectedCategory] = useState("seo");

  // ✅ Fixed fetch logic
  const { data: analyses, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analyses");
      return res.json();
    },
  });

  // Normalize API response: server may return an array or a paginated object { items, total, page }
  const latestAnalysis = Array.isArray(analyses)
    ? analyses[0]
    : analyses?.items && Array.isArray(analyses.items)
    ? analyses.items[0]
    : undefined;

  // Build metrics from latest analysis (fallbacks provided)
  const seoMetrics = [
    {
      title: "SEO Score",
      value: latestAnalysis?.seoScore ?? latestAnalysis?.kpis?.seo_score ?? 0,
      change:  latestAnalysis?.kpis ?  ( (latestAnalysis.kpis.seo_score || 0) - (latestAnalysis.previousSeoScore || 0) ) : 0,
      trend: "up" as const,
      icon: "fas fa-search",
      color: "primary",
      description: "Overall SEO performance score",
    },
    {
      title: "Organic Traffic",
      value: latestAnalysis?.kpis?.organic_traffic ?? latestAnalysis?.kpis?.organicTraffic ?? 0,
      change: 0,
      trend: "up" as const,
      icon: "fas fa-users",
      color: "chart-1",
      description: "Estimated organic search traffic",
    },
    {
      title: "Keyword Rankings",
      value: latestAnalysis?.kpis?.keyword_rankings ?? latestAnalysis?.keywords?.length ?? 0,
      change: 0,
      trend: "up" as const,
      icon: "fas fa-key",
      color: "chart-2",
      description: "Number of ranked keywords",
    },
    {
      title: "Backlinks",
      value: latestAnalysis?.kpis?.backlinks ?? latestAnalysis?.backlinks ?? 0,
      change: 0,
      trend: "down" as const,
      icon: "fas fa-link",
      color: "chart-3",
      description: "Total number of backlinks",
    },
  ];

  const seoIssues = latestAnalysis
    ? [
        { title: "Missing meta descriptions", priority: latestAnalysis.issues?.missing_meta_descriptions ? "High" : "Low", count: latestAnalysis.issues?.missing_meta_descriptions ?? (latestAnalysis.metaDescription ? 0 : 1) },
        { title: "Slow loading pages", priority: latestAnalysis.issues?.slow_loading_pages ? "Medium" : "Low", count: latestAnalysis.issues?.slow_loading_pages ?? (latestAnalysis.responseTimeMs > 1000 ? 1 : 0) },
        { title: "Broken internal links", priority: "Low", count: latestAnalysis.issues?.broken_internal_links ?? 0 },
        { title: "Missing alt tags", priority: latestAnalysis.issues?.missing_alt_tags && latestAnalysis.issues?.missing_alt_tags > 5 ? "Medium" : "Low", count: latestAnalysis.issues?.missing_alt_tags ?? 0 },
      ]
    : [
        { title: "Missing meta descriptions", priority: "High", count: 12 },
        { title: "Slow loading pages", priority: "Medium", count: 5 },
        { title: "Broken internal links", priority: "Low", count: 3 },
        { title: "Missing alt tags", priority: "Medium", count: 8 },
      ];

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading SEO data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <URLAnalyzer />
        <FilterBar
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <main className="flex-1 overflow-auto p-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Page Header */}
            <motion.div
              variants={itemVariants}
              className="flex items-center space-x-4"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  SEO Rankings
                </h1>
                <p className="text-muted-foreground">
                  Monitor your search engine optimization performance
                </p>
              </div>
            </motion.div>

            {/* SEO Metrics Grid */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {seoMetrics.map((card, index) => (
                <MetricCard key={index} {...card} />
              ))}
            </motion.div>

            {/* Charts and Issues */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <RankingTrendsChart period={selectedPeriod} />

              <Card data-testid="card-seo-issues">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>SEO Issues</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {seoIssues.map((issue, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                        data-testid={`row-seo-issue-${index}`}
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {issue.title}
                          </p>
                          <Badge
                            variant={
                              issue.priority === "High"
                                ? "destructive"
                                : issue.priority === "Medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {issue.priority}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {issue.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Detailed Rankings Table */}
            <motion.div variants={itemVariants}>
              <DetailedRankingsTable
                analysis={latestAnalysis}
                category={selectedCategory}
              />
            </motion.div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
