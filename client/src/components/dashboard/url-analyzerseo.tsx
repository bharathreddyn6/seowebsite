// no local UI state for last result; results are fetched via React Query
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
import { useLocation } from "wouter";

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
  // keep component state minimal
  const [, setLocation] = useLocation();

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

    queryClient.invalidateQueries({ queryKey: ["analyses"] });

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
    // Redirect to login if not authenticated
    try {
      const token = localStorage.getItem("auth_token");
      const user = localStorage.getItem("auth_user");
      if (!token && !user) {
        toast({
          title: "Authentication required",
          description: "Please LogIn before analyzing",
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }
    } catch {}

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

        {/* Latest analysis UI removed - analyses are shown on the SEO Rankings page */}
      </div>
    </div>
  );
}