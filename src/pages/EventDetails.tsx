import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Clock, Users, Star, ArrowLeft } from "lucide-react";
import { eventService, bookingService } from "@/lib/supabase";
import { Event, Ticket } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import AuthForm from "@/components/auth/AuthForm";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Header from "@/components/Header";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [bookingAsGuest, setBookingAsGuest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadEvent();
    }
    
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;
    
    try {
      const data = await eventService.getEvent(id);
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!event || !selectedTicket) return;

    try {
      const booking = {
        event_id: event.id,
        ticket_id: selectedTicket.id,
        quantity,
        total_amount: Number(selectedTicket.price) * quantity,
        currency: event.currency || "KSH",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min hold
        ...(user
          ? { user_id: user.id }
          : {
              guest_name: guestInfo.name,
              guest_email: guestInfo.email,
              guest_phone: guestInfo.phone,
            }),
      };

      const newBooking = await bookingService.createBooking(booking);

      toast({
        title: "Booking Created",
        description: "Your booking has been created! You have 15 minutes to complete payment.",
      });

      navigate(`/payment/${newBooking.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    }
  };


  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    if (user) {
      setIsBookingDialogOpen(true);
    } else {
      setIsAuthDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <div className="relative">
              <img 
                src={event.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop"} 
                alt={event.title}
                className="w-full h-80 object-cover rounded-lg"
              />
              <Badge className="absolute top-4 left-4" variant="secondary">
                {event.category}
              </Badge>
            </div>

            <div className="mt-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
              
              <div className="flex flex-wrap gap-4 mb-6 text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {new Date(event.date).toLocaleTimeString()}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {event.tickets_sold}/{event.max_capacity} tickets sold
                </div>
              </div>

              <p className="text-lg leading-relaxed">{event.description}</p>
            </div>
          </div>

          {/* Booking Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Select Tickets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.tickets && event.tickets.length > 0 ? (
                  event.tickets.map((ticket) => (
                    <div 
                      key={ticket.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleTicketSelect(ticket)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{ticket.name}</h3>
                        <Badge variant="outline">{ticket.type || 'regular'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {ticket.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">
                          {event.currency || 'KSH'} {ticket.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {ticket.quantity_available - ticket.quantity_sold} left
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No tickets available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Authentication Dialog */}
        <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign In or Continue as Guest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <AuthForm onAuthSuccess={() => {
                setIsAuthDialogOpen(false);
                setIsBookingDialogOpen(true);
              }} />
              
              <div className="text-center">
                <p className="text-muted-foreground mb-2">or</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAuthDialogOpen(false);
                    setBookingAsGuest(true);
                    setIsBookingDialogOpen(true);
                  }}
                >
                  Continue as Guest
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Booking Dialog */}
        <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book Tickets</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold">{selectedTicket.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                  <p className="text-lg font-bold mt-2">
                    {event.currency || 'KSH'} {selectedTicket.price.toLocaleString()}
                  </p>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Select value={quantity.toString()} onValueChange={(value) => setQuantity(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: Math.min(5, selectedTicket.quantity_available - selectedTicket.quantity_sold) }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {bookingAsGuest && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Guest Information</h4>
                    <div>
                      <Label htmlFor="guestName">Full Name</Label>
                      <Input
                        id="guestName"
                        value={guestInfo.name}
                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestEmail">Email</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestPhone">Phone</Label>
                      <Input
                        id="guestPhone"
                        value={guestInfo.phone}
                        onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                        placeholder="+254..."
                      />
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold">
                      {event.currency || 'KSH'} {(selectedTicket.price * quantity).toLocaleString()}
                    </span>
                  </div>
                  
                  <Button onClick={handleBooking} className="w-full" size="lg">
                    Book Now - 15 min hold
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Your booking will be held for 15 minutes while you complete payment
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EventDetails;