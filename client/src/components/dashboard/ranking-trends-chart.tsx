import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface RankingTrendsChartProps {
  period: string;
}

export default function RankingTrendsChart({ period }: RankingTrendsChartProps) {
  const [selectedDays, setSelectedDays] = useState(period);

  const { data: seoTrends } = useQuery({
    queryKey: ['/api/trends', 'seo', selectedDays],
  });

  const { data: brandTrends } = useQuery({
    queryKey: ['/api/trends', 'brand', selectedDays],
  });

  const { data: socialTrends } = useQuery({
    queryKey: ['/api/trends', 'social', selectedDays],
  });

  // Mock data for demonstration since we don't have actual trend data
  const mockData = [
    { date: '2024-08-25', seo: 85, brand: 75, social: 80 },
    { date: '2024-08-26', seo: 87, brand: 73, social: 82 },
    { date: '2024-08-27', seo: 89, brand: 76, social: 84 },
    { date: '2024-08-28', seo: 88, brand: 78, social: 83 },
    { date: '2024-08-29', seo: 91, brand: 74, social: 85 },
    { date: '2024-08-30', seo: 92, brand: 77, social: 84 },
    { date: '2024-09-01', seo: 92, brand: 78, social: 84 },
  ];

  return (
    <Card data-testid="card-ranking-trends">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Ranking Trends</CardTitle>
          <Select value={selectedDays} onValueChange={setSelectedDays}>
            <SelectTrigger className="w-[100px]" data-testid="select-trend-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="date" 
                className="text-xs fill-muted-foreground"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--popover-foreground))'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="seo" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="SEO"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="brand" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={3}
                name="Brand"
                dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="social" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={3}
                name="Social"
                dot={{ fill: 'hsl(var(--chart-4))', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
