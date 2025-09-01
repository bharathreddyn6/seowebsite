import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DetailedRankingsTableProps {
  analysis?: any;
  category: string;
}

export default function DetailedRankingsTable({ analysis, category }: DetailedRankingsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Get keywords from analysis or use empty array
  const keywords = analysis?.keywords || [];

  const filteredKeywords = keywords.filter((keyword: any) => 
    keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryBadge = (type: string) => {
    const categoryMap = {
      seo: { label: "SEO", variant: "default" },
      brand: { label: "Brand", variant: "secondary" },
      social: { label: "Social", variant: "outline" },
      performance: { label: "Performance", variant: "destructive" },
    };
    
    const config = categoryMap[type as keyof typeof categoryMap] || categoryMap.seo;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getTrendVisualization = (change: number) => {
    if (change > 0) {
      return <div className="w-16 h-8 bg-gradient-to-r from-green-500/20 to-green-500/5 rounded"></div>;
    } else if (change < 0) {
      return <div className="w-16 h-8 bg-gradient-to-r from-destructive/20 to-destructive/5 rounded"></div>;
    } else {
      return <div className="w-16 h-8 bg-gradient-to-r from-muted/20 to-muted/5 rounded"></div>;
    }
  };

  const getChangeDisplay = (change: number) => {
    if (change > 0) {
      return <span className="text-green-600 font-medium">+{change}</span>;
    } else if (change < 0) {
      return <span className="text-destructive font-medium">{change}</span>;
    } else {
      return <span className="text-muted-foreground font-medium">0</span>;
    }
  };

  return (
    <Card data-testid="card-detailed-rankings">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Detailed Rankings</CardTitle>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search rankings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[250px]"
              data-testid="input-search-rankings"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="px-6 py-3 bg-muted/30 border-b border-border">
          <div className="grid grid-cols-6 gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div>Keyword/Metric</div>
            <div>Category</div>
            <div>Current Rank</div>
            <div>Previous</div>
            <div>Change</div>
            <div>Trend</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {filteredKeywords.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-muted-foreground">No ranking data available.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Analyze a website to see detailed rankings.
              </p>
            </div>
          ) : (
            filteredKeywords.map((item: any, index: number) => (
              <div 
                key={index}
                className="px-6 py-4 hover:bg-muted/20 transition-colors"
                data-testid={`row-ranking-${index}`}
              >
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="font-medium text-foreground">{item.keyword}</div>
                  <div>{getCategoryBadge('seo')}</div>
                  <div className="text-2xl font-bold text-foreground" data-testid={`text-current-rank-${index}`}>
                    {item.rank}
                  </div>
                  <div className="text-muted-foreground">
                    {item.rank - item.change}
                  </div>
                  <div>
                    {getChangeDisplay(item.change)}
                  </div>
                  <div>
                    {getTrendVisualization(item.change)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
