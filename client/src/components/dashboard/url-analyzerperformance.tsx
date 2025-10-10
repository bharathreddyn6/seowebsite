import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL").refine((url) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  }, "URL must be a valid HTTP or HTTPS URL"),
});

type UrlFormData = z.infer<typeof urlSchema>;

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

interface URLAnalyzerPerformanceProps {
  onAnalysisComplete?: (data: PerformanceData) => void;
}

export default function URLAnalyzerPerformance({ onAnalysisComplete }: URLAnalyzerPerformanceProps) {
  const { toast } = useToast();
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);

  const form = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "" },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: UrlFormData) => {
      const sanitizedUrl = DOMPurify.sanitize(data.url);

      const response = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sanitizedUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch performance data");
      }

      return response.json() as Promise<PerformanceData>;
    },
    onSuccess: (data) => {
      toast({
        title: "Performance Analysis Complete",
        description: `Successfully analyzed ${data.url}`,
      });

      setPerformanceData(data);
      form.reset();

      if (onAnalysisComplete) onAnalysisComplete(data);
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze website performance",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UrlFormData) => {
    analyzeMutation.mutate(data);
  };

  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <div className="max-w-4xl">
        <h3 className="text-lg font-semibold text-foreground mb-3">
          Analyze Website Performance
        </h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-3">
            <div className="flex-1">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter website URL (e.g., https://example.com)"
                        type="url"
                        {...field}
                        className="w-full"
                        data-testid="input-performance-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={analyzeMutation.isPending} data-testid="button-analyze-performance">
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
