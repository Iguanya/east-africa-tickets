import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bookingService, paymentService } from "@/lib/supabase";
import type { BookingWithRelations } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const PaymentPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      try {
        const data = await bookingService.getBookingById(bookingId);
        setBooking(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Booking not found";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        navigate("/404");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  // Payment handler
  async function handlePayment(method: string) {
    if (!booking) return;
    try {
      await paymentService.processPayment(
        booking.id,
        booking.total_amount,
        method,
        booking.currency
      );
      toast({
        title: "Payment Successful",
        description: "Your booking has been confirmed.",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Payment failed", error);
      const message = error instanceof Error ? error.message : "Unable to complete payment.";
      toast({
        title: "Payment Failed",
        description: message,
        variant: "destructive",
      });
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="container py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">
            <strong>Booking ID:</strong> {booking.id}
          </p>
          <p className="mb-2">
            <strong>Event:</strong> {booking.events?.title || booking.event_id}
          </p>
          <p className="mb-2">
            <strong>Amount:</strong> {booking.currency} {booking.total_amount}
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Your booking will expire at{" "}
            {new Date(booking.expires_at).toLocaleTimeString()}.
          </p>

          <div className="space-y-3">
            <Button className="w-full" onClick={() => handlePayment("Stripe")}>
              Pay with Stripe
            </Button>
            <Button className="w-full" onClick={() => handlePayment("PayPal")}>
              Pay with PayPal
            </Button>
            <Button className="w-full" onClick={() => handlePayment("M-Pesa")}>
              Pay with M-Pesa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
};

export default PaymentPage;
