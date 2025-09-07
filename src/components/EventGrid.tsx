import { useState, useEffect } from "react";
import EventCard from "./EventCard";
import { Button } from "@/components/ui/button";
import { eventService } from "@/lib/supabase";
import { Event } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

const EventGrid = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventService.getEvents();
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading events...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured Events
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the hottest events happening across East Africa. From music festivals 
            to tech conferences, there's something for everyone.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length > 0 ? (
            events.map((event) => (
              <EventCard 
                key={event.id} 
                id={event.id}
                title={event.title}
                description={event.description || ""}
                image={event.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop"}
                date={new Date(event.date).toLocaleDateString()}
                time={new Date(event.date).toLocaleTimeString()}
                location={event.location}
                price={event.tickets?.[0]?.price || 0}
                currency={event.currency || 'KSH'}
                category={event.category}
                ticketsLeft={(event.max_capacity || 0) - (event.tickets_sold || 0)}
                rating={4.5}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No events available at the moment.</p>
            </div>
          )}
        </div>
        
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            View All Events
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventGrid;