-- Add recurring event fields to hives table
ALTER TABLE public.hives 
ADD COLUMN recurrence_type text DEFAULT 'none' CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly')),
ADD COLUMN recurrence_end_date date;