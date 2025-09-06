import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  trend: "up" | "down" | "stable";
  icon: string;
  color: string;
  description: string;
}

export default function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  color, 
  description 
}: MetricCardProps) 

{
  /*
  const getTrendIcon = () => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4" />;
      case "down": return <TrendingDown className="h-4 w-4" />;
      case "stable": return <Minus className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendClass = () => {
    switch (trend) {
      case "up": return "trend-up";
      case "down": return "trend-down";
      case "stable": return "trend-stable";
      default: return "trend-stable";
    }
  };
  */

  const getIconColorClasses = () => {
    const colorMap = {
      "primary": "bg-primary/10 text-primary",
      "chart-1": "bg-gradient-to-br from-chart-1/20 to-chart-1/10 text-chart-1",
      "chart-2": "bg-gradient-to-br from-chart-2/20 to-chart-2/10 text-chart-2",
      "chart-3": "bg-gradient-to-br from-chart-3/20 to-chart-3/10 text-chart-3",
      "chart-4": "bg-gradient-to-br from-chart-4/20 to-chart-4/10 text-chart-4",
      "chart-5": "bg-gradient-to-br from-chart-5/20 to-chart-5/10 text-chart-5",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.primary;
  };

  // Generate sparkline data points for visual trend
  /*
  const sparklinePoints = Array.from({ length: 12 }, (_, i) => {
    const baseValue = 50;
    const variation = trend === "up" ? i * 2 : trend === "down" ? -i * 1.5 : Math.sin(i) * 5;
    return Math.max(10, Math.min(90, baseValue + variation + (Math.random() - 0.5) * 10));
  });
  

  const pathData = sparklinePoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${(index / 11) * 100} ${100 - point}`)
    .join(' ');
  */

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="group"
        >
          
          <div className="metric-card">
            {/* Header with icon and trend */}
            <div className="flex items-start justify-between mb-6">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow", getIconColorClasses())}>
                <i className={cn(icon, "text-xl")}></i>
              </div>
              
              <div className={cn("text-sm font-semibold")}>
               
                <span></span>
              </div>
            </div>


            {/* Title and Value */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 tracking-wide uppercase">
                {title}
              </h3>
              <p className="text-4xl font-bold text-foreground tracking-tight" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
                {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
              </p>
            </div>

            {/* Sparkline */}
            <div className="relative mb-4">
              <svg 
                width="100%" 
                height="32" 
                viewBox="0 0 100 100"
                className="opacity-60 group-hover:opacity-80 transition-opacity"
              >
                <defs>
                  <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {/*
                <path
                  d={`${pathData} L 100 100 L 0 100 Z`}
                  fill={`url(#gradient-${title})`}
                  className={cn(
                    trend === "up" ? "text-success" : 
                    trend === "down" ? "text-destructive" : 
                    "text-primary"
                  )}
                />
                <path
                  d={pathData}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={cn(
                    trend === "up" ? "text-success" : 
                    trend === "down" ? "text-destructive" : 
                    "text-primary"
                  )}
                />*/}
              </svg>
            </div>

            {/* Footer */}
            <p className="text-xs text-muted-foreground font-medium">
              
            </p>
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="font-medium">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

