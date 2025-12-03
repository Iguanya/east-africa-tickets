import { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/events": "Events",
  "/admin/bookings": "Bookings",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
};

const AdminLayout = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pageTitle = useMemo(() => PAGE_TITLES[location.pathname] || "Admin Panel", [location.pathname]);

  useEffect(() => {
    if (!loading && user && !user.is_admin) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to view this page.",
        variant: "destructive",
      });
    }
  }, [loading, user, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar
        isAdmin
        onSignOut={signOut}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <main className="flex-1">
        <header className="h-12 flex items-center border-b bg-background px-4">
          <h1 className="font-semibold">{pageTitle}</h1>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

