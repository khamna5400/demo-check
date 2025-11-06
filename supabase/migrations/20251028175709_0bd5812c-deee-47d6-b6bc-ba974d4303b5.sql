-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a more secure policy requiring authentication
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Ensure users can still view their own profile
CREATE POLICY "Users can view own profile details"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);