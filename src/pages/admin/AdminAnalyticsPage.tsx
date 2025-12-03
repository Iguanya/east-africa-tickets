import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminService } from "@/lib/supabase";
import { AdminAnalyticsSummary } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminService.getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error("[AdminAnalyticsPage] Failed to load analytics:", error);
        toast({
          title: "Error",
          description: "Unable to load analytics.",
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
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <p className="text-muted-foreground">No analytics available.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Key metrics across events, bookings, and revenue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard title="Total Events" value={analytics.totalEvents} helper={`${analytics.upcomingEvents} upcoming`} />
        <AnalyticsCard title="Tickets Sold" value={analytics.ticketsSold} helper="Across all events" />
        <AnalyticsCard
          title="Total Revenue"
          value={`KSH ${analytics.totalRevenue.toLocaleString()}`}
          helper="Successful payments"
        />
        <AnalyticsCard title="Bookings Today" value={analytics.bookingsToday} helper="New reservations" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.topEvents.length === 0 && <p className="text-sm text-muted-foreground">No data available.</p>}
          {analytics.topEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between border-b pb-3 last:border-none">
              <div>
                <p className="font-semibold">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.tickets} tickets sold</p>
              </div>
              <Badge variant="secondary">KSH {event.revenue.toLocaleString()}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const AnalyticsCard = ({ title, value, helper }: { title: string; value: string | number; helper: string }) => (
  <Card>
    <CardHeader className="space-y-1">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <p className="text-2xl font-bold">{value}</p>
    </CardHeader>
    <CardContent>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </CardContent>
  </Card>
);

export default AdminAnalyticsPage;

