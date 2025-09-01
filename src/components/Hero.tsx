import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Discover Amazing Events Across
            <span className="block bg-gradient-secondary bg-clip-text text-transparent">
              East Africa
            </span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Find and book tickets for concerts, festivals, conferences, and cultural events 
            happening in Kenya, Uganda, Tanzania, and beyond.
          </p>

          {/* Search Card */}
          <Card className="p-6 bg-white/95 backdrop-blur shadow-strong max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Search events, artists, venues..." 
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Location" 
                  className="pl-10 h-12"
                />
              </div>
              
              <Button variant="hero" className="h-12 text-base">
                <Calendar className="h-4 w-4 mr-2" />
                Find Events
              </Button>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">1000+</div>
              <div className="text-white/80">Events Listed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">50K+</div>
              <div className="text-white/80">Tickets Sold</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">5</div>
              <div className="text-white/80">Countries Served</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;