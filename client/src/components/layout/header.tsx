import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import LoginPage from "@/pages/login";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();

  const handleLoginClick = () => {
    setLocation("/login");
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm border-b border-border/50 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <motion.div 
          className="flex items-center space-x-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="text-2xl font-bold gradient-text">Dashboard Overview</h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
               {/*<Clock className="h-3 w-3" />
              <span data-testid="text-last-updated">Last updated: 2 min ago</span>
              <div className="flex items-center space-x-1 ml-4">
                <div className="status-dot status-healthy"></div>
                <span className="text-xs">Live</span>
              </div>*/}
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="flex items-center space-x-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Dark Mode Toggle */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 p-0 border-border/50 hover:border-primary/50 transition-all duration-200"
              aria-label="Toggle dark mode"
              data-testid="button-theme-toggle"
            >
              <AnimatePresence mode="wait">
                {theme === "dark" ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Sun className="h-4 w-4 text-warning" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.7 }}
                  >
                    <Moon className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
          
          {/* Notifications */}
          {/*
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              className="w-10 h-10 p-0 relative border-border/50 hover:border-primary/50 transition-all duration-200"
              aria-label="Notifications"
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4" />
              <motion.span 
                className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </motion.span>
            </Button>
          </motion.div>
          */}

          {/* Login Button */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={handleLoginClick}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground rounded-full transition-all duration-200"
              data-testid="button-login"
            >
              <LogIn className="h-4 w-4" />
              <span className="text-sm font-semibold">Login/SignUp</span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}