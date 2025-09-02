import { BarChart3, Twitter, Linkedin, Github, Activity } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border/50 py-6 mt-16 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simplified Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Company Logo & Copyright */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 gradient-bg rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">RankPro Analytics</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-border"></div>
            <p className="text-xs text-muted-foreground">
              © 2024 All rights reserved
            </p>
          </div>

          {/* System Status & Links */}
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            {/* System Status */}
            <div className="flex items-center space-x-2">
              <div className="status-dot status-healthy"></div>
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3 text-success" />
                <span className="text-xs text-muted-foreground" data-testid="text-system-status">
                  All systems operational
                </span>
              </div>
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-border"></div>

            {/* Social Links */}
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-border"></div>

            {/* Legal Links */}
            <div className="flex space-x-4">
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors" data-testid="link-privacy">
                Privacy
              </a>
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors" data-testid="link-terms">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
