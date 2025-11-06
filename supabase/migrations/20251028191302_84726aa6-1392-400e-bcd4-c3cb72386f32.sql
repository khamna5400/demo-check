-- Drop the overly permissive policy that allows viewing all profile data
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a view that exposes only non-sensitive profile information
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Users can still view their own full profile (including contact info) through the existing policy
-- "Users can view own profile details" remains active