-- Create storage bucket for hive cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hive-images',
  'hive-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Create RLS policies for hive-images bucket
CREATE POLICY "Anyone can view hive images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hive-images');

CREATE POLICY "Authenticated users can upload hive images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hive-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own hive images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hive-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own hive images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hive-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);