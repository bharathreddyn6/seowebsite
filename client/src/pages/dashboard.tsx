import { motion } from "framer-motion";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import URLAnalyzer from "@/components/dashboard/url-analyzer";
import FilterBar from "@/components/dashboard/filter-bar";
import MetricCard from "@/components/dashboard/metric-card";
import RankingTrendsChart from "@/components/dashboard/ranking-trends-chart";
import PerformanceMetrics from "@/components/dashboard/performance-metrics";
import DetailedRankingsTable from "@/components/dashboard/detailed-rankings-table";
import InsightsSection from "@/components/dashboard/insights-section";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['/api/analyses'],
  });

  const latestAnalysis = Array.isArray(analyses) ? analyses[0] : undefined;

  const metricCards = [
    {
      title: "Overall Score",
      value: latestAnalysis?.overallScore || 0,
      change: 12,
      trend: "up" as const,
      icon: "fas fa-trophy",
      color: "primary",
      description: "Combined ranking across all metrics"
    },
    {
      title: "SEO Score", 
      value: latestAnalysis?.seoScore || 0,
      change: 8,
      trend: "up" as const,
      icon: "fas fa-search",
      color: "chart-2",
      description: "Search engine optimization ranking"
    },
    {
      title: "Brand Score",
      value: latestAnalysis?.brandScore || 0,
      change: -3,
      trend: "down" as const, 
      icon: "fas fa-building",
      color: "chart-3",
      description: "Brand recognition and authority metrics"
    },
    {
      title: "Social Score",
      value: latestAnalysis?.socialScore || 0,
      change: 0,
      trend: "stable" as const,
      icon: "fas fa-share-alt", 
      color: "chart-4",
      description: "Social media engagement and reach"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
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
            {/* Key Metrics Grid */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {metricCards.map((card, index) => (
                <MetricCard key={index} {...card} />
              ))}
            </motion.div>

            {/* Charts Section */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <RankingTrendsChart period={selectedPeriod} />
              <PerformanceMetrics analysis={latestAnalysis} />
            </motion.div>

            {/* Detailed Rankings Table */}
            <motion.div variants={itemVariants}>
              <DetailedRankingsTable 
                analysis={latestAnalysis}
                category={selectedCategory}
              />
            </motion.div>

            {/* Additional Insights */}
            <motion.div variants={itemVariants}>
              <InsightsSection analysis={latestAnalysis} />
            </motion.div>
          </motion.div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
