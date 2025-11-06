-- Fix: Restrict RSVP visibility to authenticated users only
-- Drop the existing public policy
DROP POLICY IF EXISTS "RSVPs are viewable by everyone" ON public.hive_rsvps;

-- Create new policy that requires authentication
CREATE POLICY "RSVPs are viewable by authenticated users only"
ON public.hive_rsvps
FOR SELECT
TO authenticated
USING (true);