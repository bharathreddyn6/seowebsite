import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
}: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up": return "text-green-600";
      case "down": return "text-destructive";
      case "stable": return "text-chart-4";
      default: return "text-muted-foreground";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up": return "↗";
      case "down": return "↘";
      case "stable": return "→";
      default: return "→";
    }
  };

  const getColorClasses = () => {
    const colorMap = {
      "primary": "bg-primary/10 text-primary",
      "chart-1": "bg-[hsl(var(--chart-1)_/_0.1)] text-[hsl(var(--chart-1))]",
      "chart-2": "bg-[hsl(var(--chart-2)_/_0.1)] text-[hsl(var(--chart-2))]",
      "chart-3": "bg-[hsl(var(--chart-3)_/_0.1)] text-[hsl(var(--chart-3))]",
      "chart-4": "bg-[hsl(var(--chart-4)_/_0.1)] text-[hsl(var(--chart-4))]",
      "chart-5": "bg-[hsl(var(--chart-5)_/_0.1)] text-[hsl(var(--chart-5))]",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.primary;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", getColorClasses())}>
                  <i className={cn(icon, "text-xl")}></i>
                </div>
                <div className={cn("text-sm font-medium", getTrendColor())}>
                  <span className="mr-1">{getTrendIcon()}</span>
                  {change > 0 ? '+' : ''}{change}%
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
              <p className="text-3xl font-bold text-foreground mb-2" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
                {value}
              </p>
              <div className="h-2 bg-gradient-to-r from-primary/20 to-primary/5 rounded mb-3"></div>
              <p className="text-xs text-muted-foreground">vs. last period</p>
            </CardContent>
          </Card>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
