-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_level AS ENUM ('newbie', 'explorer', 'connector', 'influencer', 'legend');
CREATE TYPE hive_category AS ENUM ('social', 'sports', 'arts', 'food', 'music', 'gaming', 'study', 'outdoors', 'other');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  interests TEXT[] DEFAULT '{}',
  xp INTEGER DEFAULT 0,
  level user_level DEFAULT 'newbie',
  is_business BOOLEAN DEFAULT FALSE,
  business_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hives table (events)
CREATE TABLE public.hives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category hive_category NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_image_url TEXT,
  max_attendees INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hive_rsvps table (many-to-many)
CREATE TABLE public.hive_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hive_id UUID NOT NULL REFERENCES public.hives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hive_id, user_id)
);

-- Create connections table (friendships)
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status connection_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hive_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- RLS Policies for hives
CREATE POLICY "Hives are viewable by everyone" 
  ON public.hives FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create hives" 
  ON public.hives FOR INSERT 
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update own hives" 
  ON public.hives FOR UPDATE 
  USING (auth.uid() = host_id);

CREATE POLICY "Host can delete own hives" 
  ON public.hives FOR DELETE 
  USING (auth.uid() = host_id);

-- RLS Policies for hive_rsvps
CREATE POLICY "RSVPs are viewable by everyone" 
  ON public.hive_rsvps FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can RSVP" 
  ON public.hive_rsvps FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVPs" 
  ON public.hive_rsvps FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for connections
CREATE POLICY "Users can view their connections" 
  ON public.connections FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create connections" 
  ON public.connections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their connections" 
  ON public.connections FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their connections" 
  ON public.connections FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_hives_updated_at
  BEFORE UPDATE ON public.hives
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update XP and level
CREATE OR REPLACE FUNCTION public.update_user_xp(user_id UUID, xp_amount INTEGER)
RETURNS void AS $$
DECLARE
  new_xp INTEGER;
  new_level user_level;
BEGIN
  -- Update XP
  UPDATE public.profiles 
  SET xp = xp + xp_amount 
  WHERE id = user_id
  RETURNING xp INTO new_xp;
  
  -- Calculate level based on XP
  IF new_xp >= 1000 THEN
    new_level := 'legend';
  ELSIF new_xp >= 500 THEN
    new_level := 'influencer';
  ELSIF new_xp >= 200 THEN
    new_level := 'connector';
  ELSIF new_xp >= 50 THEN
    new_level := 'explorer';
  ELSE
    new_level := 'newbie';
  END IF;
  
  -- Update level
  UPDATE public.profiles 
  SET level = new_level 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to award XP on RSVP
CREATE OR REPLACE FUNCTION public.award_rsvp_xp()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_user_xp(NEW.user_id, 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to award XP when user RSVPs
CREATE TRIGGER award_xp_on_rsvp
  AFTER INSERT ON public.hive_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.award_rsvp_xp();

-- Function to award XP on hive creation
CREATE OR REPLACE FUNCTION public.award_host_xp()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_user_xp(NEW.host_id, 25);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to award XP when user creates hive
CREATE TRIGGER award_xp_on_host
  AFTER INSERT ON public.hives
  FOR EACH ROW EXECUTE FUNCTION public.award_host_xp();