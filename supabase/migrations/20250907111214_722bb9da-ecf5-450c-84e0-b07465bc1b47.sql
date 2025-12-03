-- Set up automatic expiration every 5 minutes using pg_cron
-- First enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the booking expiration function to run every 5 minutes
SELECT cron.schedule(
  'expire-old-bookings',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://ybrzinhrlsasntnbpacz.supabase.co/functions/v1/expire-bookings',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlicnppbmhybHNhc250bmJwYWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzM0NDcsImV4cCI6MjA3MjMwOTQ0N30.L3PFtHTL8YmWmBQn0fa4sKllPUMGvaAYcJHfY1la-zQ"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);