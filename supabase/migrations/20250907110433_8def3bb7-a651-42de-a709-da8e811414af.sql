-- Remove max_capacity from events table since it will be calculated from tickets
ALTER TABLE public.events DROP COLUMN IF EXISTS max_capacity;

-- Update the ticket quantity update function to be more robust
CREATE OR REPLACE FUNCTION public.update_ticket_quantities(ticket_id uuid, qty integer)
RETURNS void
LANGUAGE plpgsql
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

-- Create function to calculate event capacity from tickets
CREATE OR REPLACE FUNCTION public.get_event_capacity(event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $function$
  SELECT COALESCE(SUM(quantity_available + quantity_sold), 0)::integer
  FROM tickets
  WHERE event_id = $1;
$function$;

-- Create function to get tickets sold for an event
CREATE OR REPLACE FUNCTION public.get_event_tickets_sold(event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $function$
  SELECT COALESCE(SUM(quantity_sold), 0)::integer
  FROM tickets
  WHERE event_id = $1;
$function$;

-- Update the payment processing to properly deduct tickets
CREATE OR REPLACE FUNCTION public.process_ticket_purchase()
RETURNS trigger
LANGUAGE plpgsql
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

-- Create trigger to automatically process ticket purchases when payment succeeds
DROP TRIGGER IF EXISTS trigger_process_ticket_purchase ON payments;
CREATE TRIGGER trigger_process_ticket_purchase
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION process_ticket_purchase();