import { supabase } from '@/integrations/supabase/client';

export { supabase };

// Helper functions for common operations
export const eventService = {
  // Get all events with tickets and calculated capacity
  async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        tickets (*)
      `)
      .eq('status', 'active')
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    // Add calculated fields for each event
    return data?.map(event => ({
      ...event,
      max_capacity: event.tickets?.reduce((sum: number, ticket: any) => 
        sum + (ticket.quantity_available || 0) + (ticket.quantity_sold || 0), 0) || 0,
      tickets_sold: event.tickets?.reduce((sum: number, ticket: any) => 
        sum + (ticket.quantity_sold || 0), 0) || 0
    })) || [];
  },

  // Get single event with tickets and calculated capacity
  async getEvent(id: string) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        tickets (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Add calculated fields
    if (data) {
      (data as any).max_capacity = data.tickets?.reduce((sum: number, ticket: any) => 
        sum + (ticket.quantity_available || 0) + (ticket.quantity_sold || 0), 0) || 0;
      (data as any).tickets_sold = data.tickets?.reduce((sum: number, ticket: any) => 
        sum + (ticket.quantity_sold || 0), 0) || 0;
    }
    
    return data;
  },

  // Create new event (admin only)
  async createEvent(event: any) {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update event (admin only)
  async updateEvent(id: string, updates: any) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete event (admin only)
  async deleteEvent(id: string) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const ticketService = {
  // Create ticket for event
  async createTicket(ticket: any) {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update ticket
  async updateTicket(id: string, updates: any) {
    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete ticket
  async deleteTicket(id: string) {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// bookingService.ts
export const bookingService = {
  // Create booking with 15-minute hold
  async createBooking(booking: any) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user bookings
  async getUserBookings(userId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        events (*),
        tickets (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Confirm booking (after payment)
  async confirmBooking(bookingId: string) {
    // 1. Check if a successful payment exists
    const { data: payments, error: payError } = await supabase
      .from('payments')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('status', 'success')

    if (payError) throw payError
    if (!payments || payments.length === 0) {
      throw new Error("No successful payment found for this booking")
    }

    // 2. Update the booking
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Cancel booking
  async cancelBooking(bookingId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const userService = {
  // Get user profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Add points to user
  async addPoints(userId: string, points: number) {
    const { data, error } = await supabase.rpc('add_user_points', {
      user_id: userId,
      points_to_add: points
    });
    
    if (error) throw error;
    return data;
  }
};

const METHOD_MAP: Record<string, string> = {
  "M-Pesa": "mpesa",
  "Stripe": "stripe",
  "PayPal": "paypal",
  "Card": "card",
  "simulated": "simulated"
}

export const paymentService = {
  async processPayment(
    bookingId: string,
    amount: number,
    method: string,
    currency: string
  ) {
    // ✅ Ensure method maps correctly to DB-accepted value
    const mappedMethod = METHOD_MAP[method] || "simulated"

    // 1️⃣ Record the payment
    const { data: payment, error } = await supabase
      .from("payments")
      .insert([
        {
          booking_id: bookingId,
          amount,
          payment_method: mappedMethod,
          currency,
          status: "success",
        },
      ])
      .select()
      .single()

    if (error) throw error

    // 2️⃣ Fetch booking details (to know which ticket & how many)
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("ticket_id, quantity")
      .eq("id", bookingId)
      .single()

    if (bookingError) throw bookingError

    // 3️⃣ Update ticket quantities using database function
    const { error: ticketError } = await supabase.rpc('update_ticket_quantities', {
      ticket_id: booking.ticket_id,
      qty: booking.quantity
    });

    if (ticketError) throw ticketError;

    return payment
  }
}
