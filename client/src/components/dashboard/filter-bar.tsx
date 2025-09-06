import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FilterBarProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export default function FilterBar({ 
  selectedPeriod, 
  setSelectedPeriod, 
  selectedCategory, 
  setSelectedCategory 
}: FilterBarProps) {
  const { toast } = useToast();

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/export/${format}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rankings-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: `Data exported as ${format.toUpperCase()} file`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card border-b border-border px-6 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          {/*
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px]" data-testid="select-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rankings</SelectItem>
              <SelectItem value="seo">SEO Only</SelectItem>
              <SelectItem value="social">Social Only</SelectItem>
              <SelectItem value="performance">Performance Only</SelectItem>
            </SelectContent>
          </Select>
          */}
        </div>
        
        {/*
        <div className="flex items-center space-x-3">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => handleExport('csv')}
            data-testid="button-export-csv"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => handleExport('json')}
            data-testid="button-export-json"
          >
            <FileCode className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>*/}
      </div>
    </div>
  );
}
