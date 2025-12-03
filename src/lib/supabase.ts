import { apiFetch } from "./api-client";
import { AdminAnalyticsSummary, Booking, Event, Ticket, UserProfile } from "@/types/database";

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export type BookingWithRelations = Booking & {
  events?: Partial<Event>;
  tickets?: Partial<Ticket>;
};

export const authService = {
  signUp(payload: { email: string; password: string; fullName: string; phone?: string }) {
    return apiFetch<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },
  signIn(payload: { email: string; password: string }) {
    return apiFetch<AuthResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },
  async getMe() {
    return apiFetch<{ user: UserProfile }>("/auth/me");
  },
};

export const eventService = {
  getEvents() {
    return apiFetch<Event[]>("/events");
  },
  getEvent(id: string) {
    return apiFetch<Event>(`/events/${id}`);
  },
  createEvent(event: Partial<Event>) {
    return apiFetch<Event>("/events", {
      method: "POST",
      body: JSON.stringify(event),
    });
  },
  updateEvent(id: string, updates: Partial<Event>) {
    return apiFetch<Event>(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },
  deleteEvent(id: string) {
    return apiFetch<void>(`/events/${id}`, {
      method: "DELETE",
    });
  },
};

export const ticketService = {
  createTicket(ticket: Partial<Ticket>) {
    return apiFetch<Ticket>("/tickets", {
      method: "POST",
      body: JSON.stringify(ticket),
    });
  },
  updateTicket(id: string, updates: Partial<Ticket>) {
    return apiFetch<Ticket>(`/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },
  deleteTicket(id: string) {
    return apiFetch<void>(`/tickets/${id}`, {
      method: "DELETE",
    });
  },
};

export const bookingService = {
  createBooking(payload: Partial<Booking>) {
    return apiFetch<BookingWithRelations>("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getUserBookings() {
    return apiFetch<BookingWithRelations[]>("/bookings");
  },
  getBookingById(id: string) {
    return apiFetch<BookingWithRelations>(`/bookings/${id}`, { skipAuth: true });
  },
  confirmBooking(id: string) {
    return apiFetch<BookingWithRelations>(`/bookings/${id}/confirm`, {
      method: "POST",
    });
  },
  cancelBooking(id: string) {
    return apiFetch<BookingWithRelations>(`/bookings/${id}/cancel`, {
      method: "POST",
    });
  },
};

export const userService = {
  getProfile(userId: string) {
    return apiFetch<UserProfile>(`/users/${userId}`);
  },
  updateProfile(userId: string, updates: Partial<UserProfile>) {
    return apiFetch<UserProfile>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },
  addPoints(userId: string, points: number) {
    return apiFetch<UserProfile>(`/users/${userId}/points`, {
      method: "POST",
      body: JSON.stringify({ points }),
    });
  },
};

export const adminService = {
  getAllBookings() {
    return apiFetch<BookingWithRelations[]>("/admin/bookings");
  },
  getAnalytics() {
    return apiFetch<AdminAnalyticsSummary>("/admin/analytics");
  },
};

const METHOD_MAP: Record<string, string> = {
  "M-Pesa": "mpesa",
  Stripe: "stripe",
  PayPal: "paypal",
  Card: "card",
  simulated: "simulated",
};

export const paymentService = {
  processPayment(bookingId: string, amount: number, method: string, currency: string) {
    const payment_method = METHOD_MAP[method] || METHOD_MAP.simulated;
    return apiFetch("/payments", {
      method: "POST",
      body: JSON.stringify({
          booking_id: bookingId,
          amount,
        payment_method,
          currency,
      }),
      skipAuth: true,
    });
  },
};
