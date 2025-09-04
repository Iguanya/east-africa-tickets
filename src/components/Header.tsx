import { Button } from "@/components/ui/button";
import { Ticket, Calendar } from "lucide-react";

// Example user object (replace with your actual auth context/hook)
const user = {
  isAuthenticated: true, // false if not logged in
  isAdmin: true,         // true only if user is an admin
};

const Header = () => {
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
          {!user.isAuthenticated && (
            <Button variant="ghost" size="sm" asChild>
              <a href="/auth">Login / Sign Up</a>
            </Button>
          )}

          {user.isAuthenticated && (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard">Dashboard</a>
              </Button>
              {user.isAdmin && (
                <Button variant="hero" size="sm" asChild>
                  <a href="/admin">
                    <Calendar className="h-4 w-4 mr-1" />
                    Admin
                  </a>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
