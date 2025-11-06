-- Create followers table
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, artist_id)
);

-- Create artist posts table
CREATE TABLE public.artist_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create post likes table
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.artist_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_new_post boolean DEFAULT true,
  email_new_event boolean DEFAULT true,
  email_event_reminder boolean DEFAULT true,
  email_new_follower boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for followers
CREATE POLICY "Users can view all followers"
  ON public.followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow artists"
  ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow artists"
  ON public.followers FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for artist_posts
CREATE POLICY "Anyone can view posts"
  ON public.artist_posts FOR SELECT
  USING (true);

CREATE POLICY "Artists can create posts"
  ON public.artist_posts FOR INSERT
  WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update own posts"
  ON public.artist_posts FOR UPDATE
  USING (auth.uid() = artist_id);

CREATE POLICY "Artists can delete own posts"
  ON public.artist_posts FOR DELETE
  USING (auth.uid() = artist_id);

-- RLS Policies for post_likes
CREATE POLICY "Anyone can view likes"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_followers_user_id ON public.followers(user_id);
CREATE INDEX idx_followers_artist_id ON public.followers(artist_id);
CREATE INDEX idx_artist_posts_artist_id ON public.artist_posts(artist_id);
CREATE INDEX idx_artist_posts_created_at ON public.artist_posts(created_at DESC);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);

-- Add trigger for artist_posts updated_at
CREATE TRIGGER update_artist_posts_updated_at
  BEFORE UPDATE ON public.artist_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add trigger for notification_preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Award XP for getting followers (artists only)
CREATE OR REPLACE FUNCTION public.award_follower_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_user_xp(NEW.artist_id, 5);
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_follower_xp_trigger
  AFTER INSERT ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.award_follower_xp();

-- Award XP for creating posts
CREATE OR REPLACE FUNCTION public.award_post_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.update_user_xp(NEW.artist_id, 15);
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_post_xp_trigger
  AFTER INSERT ON public.artist_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.award_post_xp();