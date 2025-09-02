import { Link, useLocation } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Search, 
  Building, 
  Share2, 
  Zap, 
  Download, 
  Settings, 
  ChevronLeft,
  User2,
  Crown
} from "lucide-react";

const navigationItems = [
  {
    title: "Overview Dashboard",
    href: "/",
    icon: BarChart3,
    shortTitle: "Overview"
  },
  {
    title: "SEO Rankings", 
    href: "/seo",
    icon: Search,
    shortTitle: "SEO"
  },
  {
    title: "Brand Rankings",
    href: "/brand", 
    icon: Building,
    shortTitle: "Brand"
  },
  {
    title: "Social Media",
    href: "/social",
    icon: Share2,
    shortTitle: "Social"
  },
  {
    title: "Performance",
    href: "/performance",
    icon: Zap,
    shortTitle: "Speed"
  }
];

const toolItems = [
  {
    title: "Export Data",
    href: "/export",
    icon: Download,
    shortTitle: "Export"
  },
  {
    title: "Settings", 
    href: "/settings",
    icon: Settings,
    shortTitle: "Settings"
  }
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 }
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -10 }
  };

  return (
    <motion.aside 
      className="bg-sidebar border-r border-sidebar-border flex flex-col relative"
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-accent transition-colors z-10"
        aria-label="Toggle sidebar"
      >
        <ChevronLeft 
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform duration-300",
            isCollapsed && "rotate-180"
          )} 
        />
      </button>

      {/* Logo & Branding */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center space-x-3" data-testid="link-logo">
          <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-bold gradient-text">RankPro</h1>
                <p className="text-sm text-muted-foreground">Analytics Suite</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="mb-6">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.h3 
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.2 }}
              >
                Analytics
              </motion.h3>
            )}
          </AnimatePresence>
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "nav-item group",
                      isActive && "active"
                    )}
                    data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center min-w-0">
                      <Icon className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                      )} />
                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            className={cn(
                              "ml-3 font-medium truncate",
                              isActive ? "text-primary-foreground" : "text-sidebar-foreground"
                            )}
                            variants={contentVariants}
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            transition={{ duration: 0.2 }}
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mb-6">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.h3 
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.2 }}
              >
                Tools
              </motion.h3>
            )}
          </AnimatePresence>
          <ul className="space-y-2">
            {toolItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "nav-item group",
                      isActive && "active"
                    )}
                    data-testid={`link-tool-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center min-w-0">
                      <Icon className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                      )} />
                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            className={cn(
                              "ml-3 font-medium truncate",
                              isActive ? "text-primary-foreground" : "text-sidebar-foreground"
                            )}
                            variants={contentVariants}
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            transition={{ duration: 0.2 }}
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-md">
            <User2 className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div 
                className="flex-1 min-w-0"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate" data-testid="text-username">
                    John Smith
                  </p>
                  <Crown className="h-3 w-3 text-secondary" />
                </div>
                <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
