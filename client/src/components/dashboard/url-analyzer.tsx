import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

export default function URLAnalyzer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<any>(null);

  const form = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: "",
    },
  });

  const analyzeMutation = useMutation({
  mutationFn: async (data: UrlFormData) => {
    const sanitizedUrl = DOMPurify.sanitize(data.url);

    const response = await apiRequest("POST", "/api/analyze", {
      url: sanitizedUrl,
    });

    const json = await response.json();
    return json.analysis; // ✅ only return the analysis object
  },
  onSuccess: (data) => {
    toast({
      title: "Analysis Complete",
      description: `Successfully analyzed ${data.url}`,
    });

    setLastResult(data); // <-- add this state if you want to show latest analysis

    queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });

    form.reset();
  },
  onError: (error: any) => {
    toast({
      title: "Analysis Failed",
      description: error.message || "Failed to analyze website",
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
          Analyze Website
        </h3>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex space-x-3"
          >
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
                        data-testid="input-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              disabled={analyzeMutation.isPending}
              data-testid="button-analyze"
            >
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

        {/* ✅ Show last analysis result */}
        {lastResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Latest Analysis Result</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>URL:</strong> {lastResult.url}
              </p>
              {lastResult.seoScore !== undefined && (
                <p>
                  <strong>SEO Score:</strong> {lastResult.seoScore}
                </p>
              )}
              {lastResult.wordCount !== undefined && (
                <p>
                  <strong>Word Count:</strong> {lastResult.wordCount}
                </p>
              )}
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(lastResult.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
