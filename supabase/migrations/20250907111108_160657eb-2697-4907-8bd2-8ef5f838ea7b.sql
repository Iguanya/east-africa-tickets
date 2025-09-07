-- Create function to expire old bookings and restore ticket quantities
CREATE OR REPLACE FUNCTION public.expire_old_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Find bookings that are pending and expired (older than 15 minutes)
  -- and restore their ticket quantities
  UPDATE tickets 
  SET 
    quantity_available = quantity_available + b.quantity,
    quantity_sold = quantity_sold - b.quantity,
    updated_at = NOW()
  FROM bookings b
  WHERE b.ticket_id = tickets.id 
    AND b.status = 'pending' 
    AND b.expires_at < NOW();
    
  -- Mark expired bookings as expired
  UPDATE bookings 
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'pending' 
    AND expires_at < NOW();
    
  -- Log the number of expired bookings
  RAISE NOTICE 'Expired % pending bookings older than 15 minutes', 
    (SELECT COUNT(*) FROM bookings WHERE status = 'expired' AND updated_at > NOW() - INTERVAL '1 minute');
END;
$function$;

-- Create function to automatically set booking expiration (15 minutes from creation)
CREATE OR REPLACE FUNCTION public.set_booking_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Set expires_at to 15 minutes from now if not already set
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at = NOW() + INTERVAL '15 minutes';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically set expiration on booking creation
DROP TRIGGER IF EXISTS trigger_set_booking_expiration ON bookings;
CREATE TRIGGER trigger_set_booking_expiration
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_expiration();