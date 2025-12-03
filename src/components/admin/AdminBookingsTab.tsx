import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Filter, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  ticket_id: string;
  quantity: number;
  total_amount: number;
  currency: string;
  status: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  created_at: string;
  expires_at?: string;
  events: {
    title: string;
    date: string;
    location: string;
  };
  tickets: {
    name: string;
    price: number;
  };
}

const AdminBookingsTab = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events (title, date, location),
          tickets (name, price)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExpireBookings = async () => {
    try {
      const { error } = await supabase.rpc('expire_old_bookings');
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Expired bookings have been processed",
      });
      
      // Refresh the bookings list
      fetchBookings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process expired bookings",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'expired': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredBookings = statusFilter === "all" 
    ? bookings 
    : bookings.filter(booking => booking.status === statusFilter);

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    expired: bookings.filter(b => b.status === 'expired').length,
    revenue: bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + Number(b.total_amount), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSH {stats.revenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExpireBookings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Process Expired
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-sm">
                    {booking.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.events?.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.events?.date ? new Date(booking.events.date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {booking.guest_name || 'Registered User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.guest_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.tickets?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.currency} {booking.tickets?.price}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{booking.quantity}</TableCell>
                  <TableCell className="font-medium">
                    {booking.currency} {Number(booking.total_amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(booking.status)}>
                      {getStatusText(booking.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{new Date(booking.created_at).toLocaleDateString()}</div>
                      {booking.status === 'pending' && booking.expires_at && (
                        <div className="text-xs text-muted-foreground">
                          Expires: {new Date(booking.expires_at).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookingsTab;