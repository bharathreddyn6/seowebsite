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
import { Building, TrendingUp, Users, Award } from "lucide-react";

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

export default function BrandRankings() {
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [selectedCategory, setSelectedCategory] = useState("brand");

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['/api/analyses'],
  });

  const latestAnalysis = Array.isArray(analyses) ? analyses[0] : undefined;

  const brandMetrics = [
    {
      title: "Brand Score",
      value: latestAnalysis?.brandScore || 0,
      change: -3,
      trend: "down" as const,
      icon: "fas fa-building",
      color: "primary",
      description: "Overall brand authority score"
    },
    {
      title: "Brand Mentions",
      value: 342,
      change: 15,
      trend: "up" as const,
      icon: "fas fa-quote-right",
      color: "chart-1",
      description: "Monthly brand mentions across web"
    },
    {
      title: "Domain Authority",
      value: 68,
      change: 2,
      trend: "up" as const,
      icon: "fas fa-globe",
      color: "chart-2",
      description: "Domain authority score"
    },
    {
      title: "Trust Score",
      value: 87,
      change: 0,
      trend: "stable" as const,
      icon: "fas fa-shield-alt",
      color: "chart-3",
      description: "Brand trust and reputation score"
    }
  ];

  const brandMentions = [
    { source: "TechCrunch", sentiment: "Positive", reach: "2.1M", date: "2 hours ago" },
    { source: "Forbes", sentiment: "Positive", reach: "1.8M", date: "5 hours ago" },
    { source: "Reddit", sentiment: "Neutral", reach: "450K", date: "1 day ago" },
    { source: "Twitter", sentiment: "Positive", reach: "890K", date: "2 days ago" }
  ];

  const competitors = [
    { name: "Competitor A", score: 85, position: "Above", change: 2 },
    { name: "Competitor B", score: 72, position: "Below", change: -1 },
    { name: "Competitor C", score: 91, position: "Above", change: 5 },
    { name: "Competitor D", score: 68, position: "Below", change: -3 }
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading brand data...</p>
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
            <motion.div variants={itemVariants} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Brand Rankings</h1>
                <p className="text-muted-foreground">Track your brand authority and online reputation</p>
              </div>
            </motion.div>



            

            {/* Brand Metrics Grid */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {brandMetrics.map((card, index) => (
                <MetricCard key={index} {...card} />
              ))}
            </motion.div>






            {/* Charts and Analysis */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <RankingTrendsChart period={selectedPeriod} />
              
              <Card data-testid="card-competitor-analysis">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Competitor Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competitors.map((competitor, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-b-0" data-testid={`row-competitor-${index}`}>
                        <div>
                          <p className="font-medium text-foreground">{competitor.name}</p>
                          <Badge variant={competitor.position === "Above" ? "destructive" : "default"}>
                            {competitor.position}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{competitor.score}</p>
                          <p className={`text-sm ${competitor.change > 0 ? 'text-green-600' : competitor.change < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {competitor.change > 0 ? '+' : ''}{competitor.change}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Brand Mentions */}
            <motion.div variants={itemVariants}>
              <Card data-testid="card-brand-mentions">
                <CardHeader>
                  <CardTitle>Recent Brand Mentions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {brandMentions.map((mention, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-b-0" data-testid={`row-mention-${index}`}>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{mention.source}</p>
                          <p className="text-sm text-muted-foreground">{mention.date}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant={mention.sentiment === "Positive" ? "default" : mention.sentiment === "Negative" ? "destructive" : "secondary"}>
                            {mention.sentiment}
                          </Badge>
                          <p className="text-sm font-medium text-foreground">{mention.reach}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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