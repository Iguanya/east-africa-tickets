import { Button } from "@/components/ui/button";
import { Ticket, User, Calendar } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Ticket className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            EastAfricaTickets
          </span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#events" className="text-foreground hover:text-primary transition-colors">
            Events
          </a>
          <a href="#about" className="text-foreground hover:text-primary transition-colors">
            About
          </a>
          <a href="#contact" className="text-foreground hover:text-primary transition-colors">
            Contact
          </a>
        </nav>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="/auth">
              <User className="h-4 w-4 mr-2" />
              Login / Sign Up
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard">
              <User className="h-4 w-4 mr-2" />
              Dashboard
            </a>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <a href="/admin">
              <Calendar className="h-4 w-4 mr-2" />
              Admin Panel
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;