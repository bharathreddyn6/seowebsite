import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import SEORankings from "@/pages/seo-rankings";
import BrandRankings from "@/pages/brand-rankings";
import SocialMedia from "@/pages/social-media";
import Performance from "@/pages/performance";
import Settings from "@/pages/settings";
import SEOHelmet from "@/lib/seo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/seo" component={SEORankings} />
      <Route path="/brand" component={BrandRankings} />
      <Route path="/social" component={SocialMedia} />
      <Route path="/performance" component={Performance} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SEOHelmet />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
