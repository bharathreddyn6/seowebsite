import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>&copy; 2024 RankPro Analytics. All rights reserved.</span>
            <Link 
              href="/privacy" 
              className="hover:text-foreground transition-colors"
              data-testid="link-privacy"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="hover:text-foreground transition-colors"
              data-testid="link-terms"
            >
              Terms of Service
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span>Powered by AI Analytics</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span data-testid="text-system-status">System Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
