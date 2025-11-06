-- Create user type enum
CREATE TYPE public.user_type AS ENUM ('fan', 'artist', 'venue');

-- Add user_type column to profiles (default to 'fan' for existing users)
ALTER TABLE public.profiles 
ADD COLUMN user_type user_type NOT NULL DEFAULT 'fan';

-- Artist-specific fields
ALTER TABLE public.profiles
ADD COLUMN genres text[] DEFAULT '{}',
ADD COLUMN social_links jsonb DEFAULT '{}',
ADD COLUMN artist_bio text;

-- Venue-specific fields
ALTER TABLE public.profiles
ADD COLUMN capacity integer,
ADD COLUMN amenities text[] DEFAULT '{}',
ADD COLUMN venue_type text,
ADD COLUMN contact_email text,
ADD COLUMN contact_phone text,
ADD COLUMN business_hours jsonb DEFAULT '{}';

-- Add index for user_type filtering
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type);

-- Add index for genres (for artist discovery)
CREATE INDEX idx_profiles_genres ON public.profiles USING GIN(genres);

-- Update the handle_new_user function to support user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    avatar_url,
    user_type
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'fan')
  );
  RETURN NEW;
END;
$$;