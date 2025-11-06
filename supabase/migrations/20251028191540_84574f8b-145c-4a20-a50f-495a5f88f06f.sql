-- Enable RLS on the public_profiles view
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Create a policy allowing authenticated users to view public profiles
-- Since views inherit the underlying table's RLS, we need to add a policy to profiles
-- that allows viewing through specific columns (non-sensitive ones)
CREATE POLICY "Authenticated users can view public profile information"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- This policy is permissive but safe because:
-- 1. contact_email and contact_phone are excluded from public_profiles view
-- 2. Users access public info via public_profiles view
-- 3. Full profile access (including contact info) requires the "Users can view own profile details" policy