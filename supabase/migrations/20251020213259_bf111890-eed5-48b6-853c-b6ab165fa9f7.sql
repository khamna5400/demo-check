-- Fix security warnings by setting search_path on new functions
DROP FUNCTION IF EXISTS public.get_trending_hives(INTEGER);
CREATE OR REPLACE FUNCTION public.get_trending_hives(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  latitude numeric,
  longitude numeric,
  event_date date,
  event_time time,
  category hive_category,
  cover_image_url text,
  max_attendees integer,
  host_id uuid,
  created_at timestamptz,
  rsvp_count bigint,
  trending_score numeric
) 
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    h.id,
    h.title,
    h.description,
    h.location,
    h.latitude,
    h.longitude,
    h.event_date,
    h.event_time,
    h.category,
    h.cover_image_url,
    h.max_attendees,
    h.host_id,
    h.created_at,
    COUNT(hr.id) as rsvp_count,
    (COUNT(hr.id) * (1.0 / (1.0 + EXTRACT(epoch FROM (NOW() - h.created_at)) / 86400.0))) as trending_score
  FROM public.hives h
  LEFT JOIN public.hive_rsvps hr ON h.id = hr.hive_id
  WHERE h.event_date >= CURRENT_DATE
  GROUP BY h.id
  ORDER BY trending_score DESC, rsvp_count DESC
  LIMIT limit_count;
$$;

DROP FUNCTION IF EXISTS public.get_connection_suggestions(uuid, INTEGER);
CREATE OR REPLACE FUNCTION public.get_connection_suggestions(for_user_id uuid, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id uuid,
  name text,
  bio text,
  avatar_url text,
  location text,
  interests text[],
  level user_level,
  xp integer,
  shared_interests_count bigint,
  is_connected boolean
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_interests AS (
    SELECT interests FROM public.profiles WHERE id = for_user_id
  ),
  existing_connections AS (
    SELECT friend_id FROM public.connections 
    WHERE user_id = for_user_id AND status = 'accepted'
    UNION
    SELECT user_id FROM public.connections 
    WHERE friend_id = for_user_id AND status = 'accepted'
  )
  SELECT 
    p.id,
    p.name,
    p.bio,
    p.avatar_url,
    p.location,
    p.interests,
    p.level,
    p.xp,
    (
      SELECT COUNT(*)::bigint
      FROM unnest(p.interests) AS interest
      WHERE interest = ANY(ARRAY(SELECT unnest(ui.interests) FROM user_interests ui))
    ) as shared_interests_count,
    EXISTS(SELECT 1 FROM existing_connections ec WHERE ec.friend_id = p.id) as is_connected
  FROM public.profiles p
  CROSS JOIN user_interests ui
  WHERE 
    p.id != for_user_id
    AND p.id NOT IN (SELECT friend_id FROM existing_connections)
    AND p.interests && ui.interests
  ORDER BY shared_interests_count DESC, p.xp DESC
  LIMIT limit_count;
END;
$$;