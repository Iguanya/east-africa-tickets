// Basic types for our application
export interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string;
  time: string;
  location: string;
  category: string;
  organizer_id: string;
  max_capacity: number;
  tickets_sold: number;
  status: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
  tickets?: Ticket[];
}

export interface Ticket {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity_available: number;
  quantity_sold: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  points: number;
  total_tickets_bought: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string | null;
  event_id: string;
  ticket_id: string;
  quantity: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  hold_expires_at: string;
  guest_email: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: 'card' | 'mpesa' | 'airtel_money';
  payment_reference: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}