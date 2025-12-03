import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/AppSidebar";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, CreditCard, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { bookingService, userService } from "@/lib/supabase";
import type { BookingWithRelations } from "@/lib/supabase";
import { UserProfile } from "@/types/database";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userBookings, setUserBookings] = useState<BookingWithRelations[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    setUserProfile(user);

    const load = async () => {
      setDataLoading(true);
      try {
        const profile = await userService.getProfile(user.id);
      setUserProfile(profile);
        const bookings = await bookingService.getUserBookings();
      setUserBookings(bookings || []);
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        const message = error instanceof Error ? error.message : "Failed to load your dashboard";
      toast({
        title: "Error",
          description: message,
        variant: "destructive",
      });
      } finally {
        setDataLoading(false);
      }
    };

    load();
  }, [user, toast]);

  const handleSignOut = () => {
    signOut();
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar 
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <main className="flex-1">
        <header className="h-12 flex items-center border-b bg-background px-4">
          <h1 className="font-semibold">
            Welcome back, {userProfile?.full_name || user.email}!
          </h1>
        </header>
        
        <div className="p-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <p className="text-muted-foreground">
                      {userProfile?.full_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Loyalty Points</label>
                    <p className="text-primary font-semibold">
                      {userProfile?.points || 0} points
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Member Since</label>
                    <p className="text-muted-foreground">
                      {userProfile?.created_at ? 
                        new Date(userProfile.created_at).toLocaleDateString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              <div className="grid gap-4">
                {userBookings.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                        <p className="text-muted-foreground">
                          Start exploring events and make your first booking!
                        </p>
                        <Button className="mt-4" asChild>
                          <a href="/">Browse Events</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  userBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {booking.events?.title}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                              <Calendar className="h-4 w-4" />
                              {booking.events?.date ? 
                                new Date(booking.events.date).toLocaleDateString() : 
                                'Date TBD'
                              }
                              <MapPin className="h-4 w-4 ml-2" />
                              {booking.events?.location || 'Location TBD'}
                            </CardDescription>
                          </div>
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{booking.tickets?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {booking.quantity} • Total: {booking.currency} {booking.total_amount}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-6">
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Digital tickets coming soon</h3>
                    <p className="text-muted-foreground">
                      Your digital tickets will appear here once the feature is ready.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;