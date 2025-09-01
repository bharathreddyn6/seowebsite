import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Overview Dashboard",
    href: "/",
    icon: "fas fa-tachometer-alt",
    active: true
  },
  {
    title: "SEO Rankings", 
    href: "/seo",
    icon: "fas fa-search"
  },
  {
    title: "Brand Rankings",
    href: "/brand", 
    icon: "fas fa-building"
  },
  {
    title: "Social Media",
    href: "/social",
    icon: "fas fa-share-alt"
  },
  {
    title: "Performance",
    href: "/performance",
    icon: "fas fa-bolt"
  }
];

const toolItems = [
  {
    title: "Export Data",
    href: "/export",
    icon: "fas fa-download"
  },
  {
    title: "Settings", 
    href: "/settings",
    icon: "fas fa-cog"
  }
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo & Branding */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center space-x-3" data-testid="link-logo">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <i className="fas fa-chart-line text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">RankPro</h1>
            <p className="text-sm text-muted-foreground">Analytics</p>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Rankings
          </h3>
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    location === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <i className={cn(item.icon, "w-5 text-center mr-3", 
                    location === item.href ? "text-primary" : ""
                  )}></i>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Tools
          </h3>
          <ul className="space-y-1">
            {toolItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                  data-testid={`link-tool-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <i className={cn(item.icon, "w-5 text-center mr-3")}></i>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <i className="fas fa-user text-primary-foreground text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="text-username">
              John Smith
            </p>
            <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
