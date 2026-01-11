-- Drop existing columns to recreate them with correct types
ALTER TABLE public.donations DROP COLUMN IF EXISTS image_url;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS pickup_time TEXT;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
