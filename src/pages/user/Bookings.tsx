import { useState, useEffect } from "react";
import { Calendar, MapPin, Ticket, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { bookingService, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  quantity: number;
  total_amount: number;
  currency: string;
  status: string;
  expires_at: string;
  created_at: string;
  events: {
    title: string;
    description: string;
    date: string;
    time?: string;
    location: string;
    image_url?: string;
  };
  tickets: {
    name: string;
    price: number;
  };
}

export default function UserBookings() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to view your bookings",
          variant: "destructive",
        });
        return;
      }

      const data = await bookingService.getUserBookings(user.id);
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshBookings = async () => {
    setRefreshing(true);
    
    try {
      // First trigger expiration check
      await supabase.functions.invoke('expire-bookings');
      
      // Then refresh the bookings
      await fetchBookings();
      
      toast({
        title: "Refreshed",
        description: "Your bookings have been updated",
      });
    } catch (error) {
      console.error('Error refreshing bookings:', error);
      toast({
        title: "Error",
        description: "Failed to refresh bookings",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'expired': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Payment Pending';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const minutesLeft = (expiry.getTime() - now.getTime()) / (1000 * 60);
    return minutesLeft > 0 && minutesLeft <= 5; // Expires in 5 minutes or less
  };

  const getTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const minutesLeft = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60)));
    
    if (minutesLeft === 0) return "Expired";
    if (minutesLeft < 60) return `${minutesLeft}m left`;
    
    const hoursLeft = Math.floor(minutesLeft / 60);
    const remainingMinutes = minutesLeft % 60;
    return `${hoursLeft}h ${remainingMinutes}m left`;
  };

  const downloadTicket = (bookingId: string) => {
    // In a real app, generate and download the ticket
    toast({
      title: "Download started",
      description: "Your ticket is being downloaded",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">My Bookings</h1>
              <p className="text-muted-foreground">View and manage your event bookings</p>
            </div>
            <Button 
              onClick={refreshBookings} 
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {bookings.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't booked any events yet. Browse our events to get started!
                </p>
                <Button>Browse Events</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <div className="md:flex">
                    {booking.events.image_url && (
                      <div className="md:w-48 h-48 bg-cover bg-center" 
                           style={{ backgroundImage: `url(${booking.events.image_url})` }} />
                    )}
                    <div className="flex-1">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl mb-2">{booking.events.title}</CardTitle>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant={getStatusColor(booking.status)}>
                                {getStatusText(booking.status)}
                              </Badge>
                              {booking.status === 'pending' && (
                                <Badge 
                                  variant={isExpiringSoon(booking.expires_at) ? "destructive" : "outline"}
                                  className="text-xs"
                                >
                                  {getTimeLeft(booking.expires_at)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {booking.status === 'confirmed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadTicket(booking.id)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Ticket
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground line-clamp-2">
                          {booking.events.description}
                        </p>
                        
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(booking.events.date).toLocaleDateString()}
                              {booking.events.time && ` at ${booking.events.time}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.events.location}</span>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-muted-foreground">Ticket Type:</span>
                            <span className="font-medium">{booking.tickets.name}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="font-medium">{booking.quantity}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-muted-foreground">Price per ticket:</span>
                            <span className="font-medium">
                              {booking.currency} {booking.tickets.price}
                            </span>
                          </div>
                          <div className="flex justify-between items-center font-medium">
                            <span>Total Amount:</span>
                            <span className="text-lg">
                              {booking.currency} {Number(booking.total_amount).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Booked on {new Date(booking.created_at).toLocaleDateString()}
                          {booking.status === 'pending' && (
                            <span className="block mt-1">
                              Expires: {new Date(booking.expires_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}