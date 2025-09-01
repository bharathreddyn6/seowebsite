import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceMetricsProps {
  analysis?: any;
}

const performanceMetrics = [
  {
    name: "Page Speed",
    description: "Core Web Vitals",
    icon: "fas fa-rocket",
    color: "chart-1",
    value: 89,
    change: 5,
    trend: "up"
  },
  {
    name: "Mobile Score", 
    description: "Responsiveness",
    icon: "fas fa-mobile-alt",
    color: "chart-2", 
    value: 95,
    change: 2,
    trend: "up"
  },
  {
    name: "Security",
    description: "SSL & Headers",
    icon: "fas fa-shield-alt",
    color: "chart-3",
    value: 98,
    change: 0,
    trend: "stable"
  },
  {
    name: "User Experience",
    description: "Accessibility", 
    icon: "fas fa-users",
    color: "chart-4",
    value: 91,
    change: -1,
    trend: "down"
  }
];

export default function PerformanceMetrics({ analysis }: PerformanceMetricsProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <ArrowUp className="h-3 w-3" />;
      case "down": return <ArrowDown className="h-3 w-3" />;
      case "stable": return <Minus className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-green-600";
      case "down": return "text-destructive";
      case "stable": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      "chart-1": "bg-[hsl(var(--chart-1)_/_0.1)] text-[hsl(var(--chart-1))]",
      "chart-2": "bg-[hsl(var(--chart-2)_/_0.1)] text-[hsl(var(--chart-2))]",
      "chart-3": "bg-[hsl(var(--chart-3)_/_0.1)] text-[hsl(var(--chart-3))]",
      "chart-4": "bg-[hsl(var(--chart-4)_/_0.1)] text-[hsl(var(--chart-4))]",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap["chart-1"];
  };

  return (
    <Card data-testid="card-performance-metrics">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Performance Metrics</CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-details">
            View Details
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performanceMetrics.map((metric, index) => (
            <div 
              key={index}
              className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
              data-testid={`row-metric-${metric.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center space-x-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", getColorClasses(metric.color))}>
                  <i className={cn(metric.icon, "text-sm")}></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{metric.name}</p>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground" data-testid={`text-${metric.name.toLowerCase().replace(/\s+/g, '-')}-value`}>
                  {analysis?.metrics?.[metric.name.toLowerCase().replace(/\s+/g, '')] || metric.value}
                </p>
                <div className={cn("text-xs font-medium flex items-center justify-end", getTrendColor(metric.trend))}>
                  {metric.change > 0 ? '+' : ''}{metric.change}% {getTrendIcon(metric.trend)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
