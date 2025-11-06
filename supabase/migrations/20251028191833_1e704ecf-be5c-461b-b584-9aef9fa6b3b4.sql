-- Drop the problematic policy that would expose contact information
DROP POLICY IF EXISTS "Authenticated users can view public profile information" ON public.profiles;

-- Drop the public_profiles view since it doesn't work well with RLS
DROP VIEW IF EXISTS public.public_profiles;

-- Create a SECURITY DEFINER function that returns only public profile fields
-- This bypasses RLS but only returns safe, non-sensitive data
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  bio text,
  avatar_url text,
  location text,
  interests text[],
  business_name text,
  business_hours jsonb,
  is_business boolean,
  genres text[],
  level user_level,
  artist_bio text,
  xp integer,
  amenities text[],
  venue_type text,
  capacity integer,
  social_links jsonb,
  user_type user_type,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  FROM public.profiles
  WHERE id = profile_id;
$$;

-- Create a function to get all public profiles (for browsing)
CREATE OR REPLACE FUNCTION public.get_all_public_profiles()
RETURNS TABLE (
  id uuid,
  name text,
  bio text,
  avatar_url text,
  location text,
  interests text[],
  business_name text,
  business_hours jsonb,
  is_business boolean,
  genres text[],
  level user_level,
  artist_bio text,
  xp integer,
  amenities text[],
  venue_type text,
  capacity integer,
  social_links jsonb,
  user_type user_type,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_public_profiles() TO authenticated;