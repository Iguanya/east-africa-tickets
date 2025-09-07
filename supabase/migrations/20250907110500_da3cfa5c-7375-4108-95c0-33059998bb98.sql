-- Fix security warnings by setting search_path on all functions

-- Update the ticket quantity function
CREATE OR REPLACE FUNCTION public.update_ticket_quantities(ticket_id uuid, qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  -- Check if enough tickets are available
  IF NOT EXISTS (
    SELECT 1 FROM tickets 
    WHERE id = ticket_id 
    AND quantity_available >= qty
  ) THEN
    RAISE EXCEPTION 'Not enough tickets available';
  END IF;

  -- Update the ticket quantities
  UPDATE tickets
  SET 
    quantity_available = quantity_available - qty,
    quantity_sold = quantity_sold + qty,
    updated_at = NOW()
  WHERE id = ticket_id;
END;
$function$;

-- Update capacity calculation function
CREATE OR REPLACE FUNCTION public.get_event_capacity(event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COALESCE(SUM(quantity_available + quantity_sold), 0)::integer
  FROM tickets
  WHERE event_id = $1;
$function$;

-- Update tickets sold function
CREATE OR REPLACE FUNCTION public.get_event_tickets_sold(event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COALESCE(SUM(quantity_sold), 0)::integer
  FROM tickets
  WHERE event_id = $1;
$function$;

-- Update payment processing function
CREATE OR REPLACE FUNCTION public.process_ticket_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only process if payment is successful
  IF NEW.status = 'success' THEN
    -- Get booking details
    DECLARE
      booking_ticket_id uuid;
      booking_quantity integer;
    BEGIN
      SELECT ticket_id, quantity INTO booking_ticket_id, booking_quantity
      FROM bookings
      WHERE id = NEW.booking_id;
      
      -- Update ticket quantities
      PERFORM update_ticket_quantities(booking_ticket_id, booking_quantity);
      
      -- Update booking status to confirmed
      UPDATE bookings
      SET status = 'confirmed', updated_at = NOW()
      WHERE id = NEW.booking_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update add_user_points function to have proper security
CREATE OR REPLACE FUNCTION public.add_user_points(user_id uuid, points_to_add integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;