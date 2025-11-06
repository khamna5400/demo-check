-- Fix RSVP policy to properly restrict to authenticated users
DROP POLICY IF EXISTS "RSVPs are viewable by authenticated users only" ON public.hive_rsvps;

CREATE POLICY "RSVPs are viewable by authenticated users only"
ON public.hive_rsvps
FOR SELECT
USING (auth.role() = 'authenticated');