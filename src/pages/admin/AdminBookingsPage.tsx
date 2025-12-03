import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/lib/supabase";
import type { BookingWithRelations } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminService.getAllBookings();
        setBookings(data || []);
      } catch (error) {
        console.error("[AdminBookingsPage] Failed to load bookings:", error);
        toast({
          title: "Error",
          description: "Unable to load bookings.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Track every ticket reservation across the platform.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Booking ID</th>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Tickets</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t">
                    <td className="py-3 pr-4 font-mono text-xs">{booking.id.slice(0, 8)}...</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{booking.events?.title || "Unknown Event"}</div>
                      <div className="text-xs text-muted-foreground">{booking.events?.location}</div>
                    </td>
                    <td className="py-3 pr-4">
                      {booking.user?.full_name || booking.guest_name || "Guest"}
                      <div className="text-xs text-muted-foreground">{booking.user?.email || booking.guest_email}</div>
                    </td>
                    <td className="py-3 pr-4">{booking.quantity}</td>
                    <td className="py-3 pr-4">
                      {booking.currency} {Number(booking.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                      {new Date(booking.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookingsPage;

