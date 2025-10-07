// client/src/pages/BrandRankings.tsx
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Award } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function BrandRankings() {

  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [selectedCategory, setSelectedCategory] = useState("brand");
  const [analyzedUrl, setAnalyzedUrl] = useState<string>("");
  const [brandData, setBrandData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Handler to receive analyzed data from URLAnalyzer
  const handleAnalysisComplete = (url: string, data: any) => {
    setAnalyzedUrl(url);
    setBrandData(data);
    setError("");
    setLoading(false);
  };

  // Handler to set loading state from URLAnalyzer
  const handleAnalysisStart = () => {
    setLoading(true);
    setError("");
  };

  // Handler to set error state from URLAnalyzer
  const handleAnalysisError = (err: string) => {
    setError(err);
    setLoading(false);
  };




  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Analyzing brand data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const brandMetrics = [
    {
      title: "Brand Score",
      value: brandData?.brandScore || 0,
      description: "Overall brand authority score",
      icon: "lucide-award",
      color: "primary",
    },
    {
      title: "Domain Authority",
      value: brandData?.domainAuthority || 0,
      description: "Domain authority score",
      icon: "lucide-building",
      color: "chart-1",
    },
    {
      title: "Trust Score",
      value: brandData?.trustScore || 0,
      description: "Brand trust and reputation score",
      icon: "lucide-shield-check",
      color: "chart-2",
    },
    {
      title: "News Mentions",
      value: brandData?.brandMentions || 0,
      description: "Recent brand mentions across web",
      icon: "lucide-newspaper",
      color: "chart-3",
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <URLAnalyzer
          onAnalysisComplete={handleAnalysisComplete}
          onAnalysisStart={handleAnalysisStart}
          onAnalysisError={handleAnalysisError}
        />
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
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Brand Rankings
                </h1>
                <p className="text-muted-foreground">
                  Track your brand authority and online reputation
                </p>
              </div>
            </motion.div>

            {/* Brand Metrics */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {brandMetrics.map((card, index) => (
                <MetricCard
                  key={index}
                  title={card.title}
                  value={card.value}
                  description={card.description}
                  color={card.color}
                  icon={card.icon}
                  change={0}
                  trend="stable"
                />
              ))}
            </motion.div>

            {/* Competitor placeholder */}
            <motion.div variants={itemVariants} className="grid grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Competitor Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Competitor data will appear here.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
