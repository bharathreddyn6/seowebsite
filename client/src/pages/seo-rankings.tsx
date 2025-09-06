import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
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
      const res = await fetch("http://localhost:5000/api/analyses");
      if (!res.ok) throw new Error("Failed to fetch analyses");
      return res.json();
    },
  });

  const latestAnalysis = Array.isArray(analyses) ? analyses[0] : undefined;

  const seoMetrics = [
    {
      title: "SEO Score",
      value: latestAnalysis?.seoScore || 0,
      change: 8,
      trend: "up" as const,
      icon: "fas fa-search",
      color: "primary",
      description: "Overall SEO performance score",
    },
    {
      title: "Organic Traffic",
      value: 85,
      change: 12,
      trend: "up" as const,
      icon: "fas fa-users",
      color: "chart-1",
      description: "Estimated organic search traffic",
    },
    {
      title: "Keyword Rankings",
      value: 156,
      change: 5,
      trend: "up" as const,
      icon: "fas fa-key",
      color: "chart-2",
      description: "Number of ranked keywords",
    },
    {
      title: "Backlinks",
      value: 247,
      change: -2,
      trend: "down" as const,
      icon: "fas fa-link",
      color: "chart-3",
      description: "Total number of backlinks",
    },
  ];

  const seoIssues = [
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
