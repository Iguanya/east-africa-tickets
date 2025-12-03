import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Header = () => {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Ticket className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            EastAfricaTickets
          </span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {["Events", "About", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {!loading && !user && (
            <Button variant="ghost" size="sm" asChild>
              <a href="/auth">Login / Sign Up</a>
            </Button>
          )}

          {!loading && user && (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={user.is_admin ? "/admin" : "/dashboard"}>Dashboard</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
