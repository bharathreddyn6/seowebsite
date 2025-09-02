import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface RankingTrendsChartProps {
  period: string;
}

export default function RankingTrendsChart({ period }: RankingTrendsChartProps) {
  const [selectedDays, setSelectedDays] = useState(period);

  const { data: seoTrends } = useQuery({
    queryKey: ['/api/trends/seo', selectedDays],
  });

  const { data: brandTrends } = useQuery({
    queryKey: ['/api/trends/brand', selectedDays],
  });

  const { data: socialTrends } = useQuery({
    queryKey: ['/api/trends/social', selectedDays],
  });

  // Enhanced mock data for demonstration
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="col-span-2"
      data-testid="card-ranking-trends"
    >
      <div className="premium-card h-full">
        <div className="p-6">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold gradient-text">Ranking Trends</h3>
                <p className="text-sm text-muted-foreground">Performance over time</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Legend with enhanced styling */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-chart-1 to-chart-1/80 shadow-sm"></div>
                  <span className="font-medium text-foreground">SEO</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-chart-2 to-chart-2/80 shadow-sm"></div>
                  <span className="font-medium text-foreground">Brand</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-chart-3 to-chart-3/80 shadow-sm"></div>
                  <span className="font-medium text-foreground">Social</span>
                </div>
              </div>

              {/* Period Selector */}
              <Select value={selectedDays} onValueChange={setSelectedDays}>
                <SelectTrigger className="w-[120px]" data-testid="select-trend-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enhanced Chart */}
          <div className="h-[320px] chart-container" data-testid="chart-ranking-trends">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="seoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="socialGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '14px',
                    padding: '12px'
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: '8px' }}
                />
                
                {/* Area fills for depth */}
                <Area 
                  type="monotone" 
                  dataKey="seo" 
                  stroke="hsl(var(--chart-1))" 
                  fill="url(#seoGradient)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Area 
                  type="monotone" 
                  dataKey="brand" 
                  stroke="hsl(var(--chart-2))" 
                  fill="url(#brandGradient)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Area 
                  type="monotone" 
                  dataKey="social" 
                  stroke="hsl(var(--chart-3))" 
                  fill="url(#socialGradient)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Line overlays for crisp edges */}
                <Line 
                  type="monotone" 
                  dataKey="seo" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: 'hsl(var(--chart-1))', strokeWidth: 3, fill: 'hsl(var(--background))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="brand" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: 'hsl(var(--chart-2))', strokeWidth: 3, fill: 'hsl(var(--background))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="social" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: 'hsl(var(--chart-3))', strokeWidth: 3, fill: 'hsl(var(--background))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}