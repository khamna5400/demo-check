-- Recreate the view without SECURITY DEFINER to fix the linter warning
-- This ensures the view uses the querying user's permissions, not the creator's
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker=true)
AS
SELECT 
  id,
  name,
  bio,
  avatar_url,
  location,
  interests,
  business_name,
  business_hours,
  is_business,
  genres,
  level,
  artist_bio,
  xp,
  amenities,
  venue_type,
  capacity,
  social_links,
  user_type,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;