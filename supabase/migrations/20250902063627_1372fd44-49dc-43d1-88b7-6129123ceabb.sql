-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  points INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  max_capacity INTEGER NOT NULL,
  tickets_sold INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  currency TEXT DEFAULT 'KSH' CHECK (currency IN ('KSH', 'UGX', 'TZS', 'RWF', 'ETB', 'USD')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (id)
);

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('regular', 'vip', 'early_bird', 'student', 'group')),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity_available INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_id UUID NOT NULL REFERENCES public.events(id),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id),
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('KSH', 'UGX', 'TZS', 'RWF', 'ETB', 'USD')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
  guest_email TEXT,
  guest_name TEXT,
  guest_phone TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('KSH', 'UGX', 'TZS', 'RWF', 'ETB', 'USD')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('visa', 'mastercard', 'mpesa', 'airtel_money')),
  payment_reference TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for events (public read, admin write)
CREATE POLICY "Anyone can view active events" ON public.events
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policies for tickets (public read, admin write)
CREATE POLICY "Anyone can view tickets" ON public.tickets
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage tickets" ON public.tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policies for payments
CREATE POLICY "Users can view their booking payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id AND (user_id = auth.uid() OR user_id IS NULL)
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Users can create payments for their bookings" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to add user points
CREATE OR REPLACE FUNCTION public.add_user_points(user_id UUID, points_to_add INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_points INTEGER;
BEGIN
  UPDATE public.user_profiles 
  SET points = points + points_to_add,
      updated_at = NOW()
  WHERE id = user_id;
  
  SELECT points INTO new_points 
  FROM public.user_profiles 
  WHERE id = user_id;
  
  RETURN new_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX idx_bookings_expires_at ON public.bookings(expires_at);
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);