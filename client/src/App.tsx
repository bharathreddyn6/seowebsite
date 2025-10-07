import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { GoogleOAuthProvider } from "@react-oauth/google";
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
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import ExportPage from "@/pages/export";


const GOOGLE_CLIENT_ID = "562847316557-10l5a5cnlmvq1doa7ras83em6m9tuv86.apps.googleusercontent.com";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/seo" component={SEORankings} />
      <Route path="/brand" component={BrandRankings} />
      <Route path="/social" component={SocialMedia} />
      <Route path="/performance" component={Performance} />
      <Route path="/settings" component={Settings} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/export" component={ExportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("initial_logout_done")) {
        if (window.location.pathname === "/") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
        }
        sessionStorage.setItem("initial_logout_done", "1");
      }
    } catch {}
  }, []);
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SEOHelmet />
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
