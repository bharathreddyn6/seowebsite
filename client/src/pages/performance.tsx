import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import URLAnalyzerPerformance from "@/components/dashboard/url-analyzerperformance";
import FilterBar from "@/components/dashboard/filter-bar";
import MetricCard from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Shield, Monitor } from "lucide-react";

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

interface PerformanceData {
  url: string;
  performanceScore: number;
  pageLoadTime: number;
  coreWebVitals: {
    LCP: number;
    FID: number;
    CLS: number;
  };
  uptime: string;
}

export default function Performance() {
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [selectedCategory, setSelectedCategory] = useState("performance");
  const [currentPerformanceData, setCurrentPerformanceData] = useState<PerformanceData | null>(null);

  // Get latest SEO analysis for fallback data
  const { data: analyses } = useQuery({
    queryKey: ["analyses"],
    queryFn: async () => {
      const res = await fetch("/api/analyses");
      if (!res.ok) throw new Error("Failed to fetch analyses");
      return res.json();
    },
  });

  const latestAnalysis = Array.isArray(analyses) ? analyses[0] : undefined;

  // Use current performance data if available, otherwise fall back to latest analysis
  const displayData = currentPerformanceData || {
    url: latestAnalysis?.url || "",
    performanceScore: latestAnalysis?.performanceScore ?? 0,
    pageLoadTime: latestAnalysis?.pageLoadTime ?? 0,
    uptime: latestAnalysis?.uptime ?? "99.9",
    coreWebVitals: latestAnalysis?.coreWebVitals ?? {
      LCP: 0, FID: 0, CLS: 0
    },
  };

  const performanceMetrics = [
    {
      title: "Performance Score",
      value: displayData.performanceScore,
      change: 3,
      trend: "up" as const,
      icon: "fas fa-bolt",
      color: "primary",
      description: "Overall website performance score"
    },
    {
      title: "Page Load Time",
      value: parseFloat(displayData.pageLoadTime.toString()),
      change: -8,
      trend: "up" as const,
      icon: "fas fa-clock",
      color: "chart-1",
      description: "Average page load time in seconds"
    },
    {
      title: "Core Web Vitals",
      value: displayData.performanceScore, // Or a more specific CWV score if available
      change: 12,
      trend: "up" as const,
      icon: "fas fa-tachometer-alt",
      color: "chart-2",
      description: "Core Web Vitals performance score"
    },
    {
      title: "Uptime",
      value: parseFloat(displayData.uptime),
      change: 0,
      trend: "stable" as const,
      icon: "fas fa-server",
      color: "chart-3",
      description: "Website uptime percentage"
    }
  ];
 
  const coreWebVitals = [
    { 
      name: "Largest Contentful Paint (LCP)", 
      value: `${displayData.coreWebVitals.LCP}ms`, 
      score: 88, 
      status: "Good" 
    },
    { 
      name: "First Input Delay (FID)", 
      value: `${displayData.coreWebVitals.FID}ms`, 
      score: 95, 
      status: "Good" 
    },
    { 
      name: "Cumulative Layout Shift (CLS)", 
      value: displayData.coreWebVitals.CLS.toString(), 
      score: 87, 
      status: "Good" 
    }
  ];

  const pageInsights = [
    { page: "/", loadTime: "1.2s", size: "2.1MB", requests: 45, score: 92 },
    { page: "/about", loadTime: "1.5s", size: "1.8MB", requests: 38, score: 88 },
    { page: "/services", loadTime: "2.1s", size: "3.2MB", requests: 52, score: 84 },
    { page: "/contact", loadTime: "1.1s", size: "1.5MB", requests: 35, score: 94 }
  ];

  const optimizationTips = [
    { title: "Compress images", impact: "High", savings: "1.2MB", status: "Recommended" },
    { title: "Minify CSS/JS", impact: "Medium", savings: "340KB", status: "In Progress" },
    { title: "Enable browser caching", impact: "High", savings: "2.1s", status: "Completed" },
    { title: "Use CDN", impact: "Medium", savings: "0.8s", status: "Recommended" }
  ];

  const handleAnalysisComplete = (data: PerformanceData) => {
    setCurrentPerformanceData(data);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <URLAnalyzerPerformance onAnalysisComplete={handleAnalysisComplete} />
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
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Performance</h1>
                <p className="text-muted-foreground">Monitor your website speed and performance metrics</p>
              </div>
            </motion.div>

            {/* Performance Metrics Grid */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {performanceMetrics.map((card, index) => (
                <MetricCard key={index} {...card} />
              ))}
            </motion.div>

            {/* Core Web Vitals */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <Card data-testid="card-core-web-vitals">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Core Web Vitals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {coreWebVitals.map((vital, index) => (
                      <div key={index} className="space-y-2" data-testid={`vital-${index}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{vital.name}</p>
                          <Badge variant={vital.status === "Good" ? "default" : "destructive"}>
                            {vital.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{vital.value}</span>
                          <span className="font-medium text-foreground">{vital.score}/100</span>
                        </div>
                        <Progress value={vital.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Performance Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Overall Score</span>
                      <span className="text-2xl font-bold text-foreground">
                        {displayData.performanceScore}
                      </span>
                    </div>
                    <Progress value={displayData.performanceScore} className="h-3" />
                    
                    <div className="pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Load Time</span>
                        <span className="font-medium text-foreground">
                          {displayData.pageLoadTime}s
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Uptime</span>
                        <span className="font-medium text-foreground">
                          {displayData.uptime}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Page Insights */}
            <motion.div variants={itemVariants}>
              <Card data-testid="card-page-insights">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5" />
                    <span>Page Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground border-b border-border pb-2">
                      <div>Page</div>
                      <div>Load Time</div>
                      <div>Size</div>
                      <div>Requests</div>
                      <div>Score</div>
                    </div>
                    {pageInsights.map((page, index) => (
                      <div key={index} className="grid grid-cols-5 gap-4 text-sm py-2 border-b border-border last:border-b-0" data-testid={`page-${index}`}>
                        <div className="font-medium text-foreground">{page.page}</div>
                        <div className="text-muted-foreground">{page.loadTime}</div>
                        <div className="text-muted-foreground">{page.size}</div>
                        <div className="text-muted-foreground">{page.requests}</div>
                        <div className="font-medium text-foreground">{page.score}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Optimization Recommendations */}
            <motion.div variants={itemVariants}>
              <Card data-testid="card-optimization-tips">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Optimization Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {optimizationTips.map((tip, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-b-0" data-testid={`tip-${index}`}>
                        <div>
                          <p className="font-medium text-foreground">{tip.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={tip.impact === "High" ? "destructive" : "default"}>
                              {tip.impact} Impact
                            </Badge>
                            <Badge variant={tip.status === "Completed" ? "default" : tip.status === "In Progress" ? "secondary" : "outline"}>
                              {tip.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{tip.savings}</p>
                          <p className="text-sm text-muted-foreground">potential savings</p>
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