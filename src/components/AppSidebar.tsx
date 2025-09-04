import { useState } from "react";
import { Home, Calendar, Users, BarChart3, Settings, LogOut, Menu } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: Home },
  { title: "Events", url: "/admin/events", icon: Calendar },
  { title: "Bookings", url: "/admin/bookings", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const userItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "My Bookings", url: "/dashboard/bookings", icon: Calendar },
  { title: "Profile", url: "/dashboard/profile", icon: Users },
];

interface AppSidebarProps {
  isAdmin?: boolean;
  onSignOut?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AppSidebar({ isAdmin = false, onSignOut, collapsed = false, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const items = isAdmin ? adminItems : userItems;
  
  const isActive = (path: string) => currentPath === path;

  return (
    <div
      className={cn(
        "border-r bg-card transition-all duration-300 flex flex-col",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="font-semibold text-sm">
              {isAdmin ? "Admin Panel" : "Dashboard"}
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive(item.url)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      {onSignOut && (
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
              collapsed && "px-0"
            )}
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      )}
    </div>
  );
}