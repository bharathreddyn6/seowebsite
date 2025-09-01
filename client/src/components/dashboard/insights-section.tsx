import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus, Building } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightsSectionProps {
  analysis?: any;
}

export default function InsightsSection({ analysis }: InsightsSectionProps) {
  const topKeywords = analysis?.keywords?.slice(0, 3) || [];
  const competitors = analysis?.competitors || [];

  const recentChanges = [
    {
      title: "SEO Score improved",
      time: "2 hours ago", 
      type: "improvement",
      icon: ArrowUp,
      color: "text-green-600 bg-green-100 dark:bg-green-900/20"
    },
    {
      title: "Data refreshed",
      time: "1 day ago",
      type: "update", 
      icon: Minus,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20"
    },
    {
      title: "Brand mention decrease",
      time: "2 days ago",
      type: "decline",
      icon: ArrowDown, 
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Top Keywords */}
      <Card data-testid="card-top-keywords">
        <CardHeader>
          <CardTitle>Top Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topKeywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No keyword data available</p>
            ) : (
              topKeywords.map((keyword: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between"
                  data-testid={`row-keyword-${index}`}
                >
                  <span className="text-sm text-foreground">{keyword.keyword}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-foreground">
                      Rank {keyword.rank}
                    </span>
                    {keyword.change > 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-600" />
                    ) : keyword.change < 0 ? (
                      <ArrowDown className="h-3 w-3 text-destructive" />
                    ) : (
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Competitor Analysis */}
      <Card data-testid="card-competitor-analysis">
        <CardHeader>
          <CardTitle>Competitor Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {competitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No competitor data available</p>
            ) : (
              competitors.map((competitor: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-center justify-between"
                  data-testid={`row-competitor-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <Building className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {competitor.domain}
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    competitor.position === "above" ? "text-destructive" : "text-green-600"
                  )}>
                    {competitor.position === "above" ? "Above" : "Below"}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Changes */}
      <Card data-testid="card-recent-changes">
        <CardHeader>
          <CardTitle>Recent Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentChanges.map((change, index) => {
              const Icon = change.icon;
              return (
                <div 
                  key={index}
                  className="flex items-start space-x-3"
                  data-testid={`row-change-${index}`}
                >
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center mt-0.5", change.color)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{change.title}</p>
                    <p className="text-xs text-muted-foreground">{change.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
