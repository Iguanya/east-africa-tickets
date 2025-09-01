import EventCard from "./EventCard";
import { Button } from "@/components/ui/button";

// Mock data for demonstration
const mockEvents = [
  {
    id: "1",
    title: "Nairobi Jazz Festival 2024",
    description: "Experience the best of East African jazz with international and local artists performing under the stars.",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
    date: "March 15, 2024",
    time: "7:00 PM",
    location: "KICC, Nairobi",
    price: 2500,
    currency: "KSH",
    category: "Music",
    ticketsLeft: 150,
    rating: 4.8
  },
  {
    id: "2", 
    title: "East Africa Tech Summit",
    description: "Join tech leaders, entrepreneurs, and innovators for the premier technology conference in East Africa.",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
    date: "April 22, 2024",
    time: "9:00 AM",
    location: "Kampala Serena Hotel",
    price: 15000,
    currency: "UGX",
    category: "Conference",
    ticketsLeft: 75,
    rating: 4.9
  },
  {
    id: "3",
    title: "Zanzibar Cultural Festival",
    description: "Celebrate the rich cultural heritage of Zanzibar with traditional music, dance, and local cuisine.",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    date: "May 10, 2024", 
    time: "6:00 PM",
    location: "Stone Town, Zanzibar",
    price: 45,
    currency: "USD",
    category: "Cultural",
    ticketsLeft: 200,
    rating: 4.7
  },
  {
    id: "4",
    title: "Kigali Comedy Night",
    description: "Laugh the night away with East Africa's funniest comedians and special international guests.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
    date: "March 30, 2024",
    time: "8:00 PM", 
    location: "Kigali Convention Centre",
    price: 8000,
    currency: "RWF",
    category: "Comedy",
    ticketsLeft: 300,
    rating: 4.6
  },
  {
    id: "5",
    title: "Dar es Salaam Food Festival",
    description: "Taste the flavors of Tanzania and East Africa with food stalls, cooking demos, and cultural performances.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
    date: "April 5, 2024",
    time: "11:00 AM",
    location: "Coco Beach, Dar es Salaam",
    price: 25000,
    currency: "TZS",
    category: "Food",
    ticketsLeft: 500,
    rating: 4.5
  },
  {
    id: "6",
    title: "Addis Ababa Fashion Week",
    description: "Witness the latest in African fashion with top designers showcasing their collections.",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop",
    date: "June 1, 2024",
    time: "7:30 PM",
    location: "Addis Ababa Stadium",
    price: 1200,
    currency: "ETB", 
    category: "Fashion",
    ticketsLeft: 120,
    rating: 4.8
  }
];

const EventGrid = () => {
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
          {mockEvents.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
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