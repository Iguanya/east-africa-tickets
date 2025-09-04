-- Fix security warnings by setting proper search_path on functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;