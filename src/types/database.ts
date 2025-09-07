// Basic types for our application
export interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string;
  location: string;
  category: string;
  max_capacity?: number; // Calculated from tickets
  tickets_sold?: number; // Calculated from tickets
  status: string;
  currency: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  tickets?: Ticket[];
}

export interface Ticket {
  id: string;
  event_id: string;
  type: string;
  name: string;
  description: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  points: number;
  is_admin?: boolean;
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
  status: string;
  guest_email: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  transaction_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}