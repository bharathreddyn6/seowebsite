import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Bell, Moon, Sun } from "lucide-react";

export default function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <i className="fas fa-clock"></i>
            <span data-testid="text-last-updated">Last updated: 2 min ago</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 p-0"
            aria-label="Toggle dark mode"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          {/* Notifications */}
          <Button
            variant="secondary"
            size="sm"
            className="w-10 h-10 p-0 relative"
            aria-label="Notifications"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}
