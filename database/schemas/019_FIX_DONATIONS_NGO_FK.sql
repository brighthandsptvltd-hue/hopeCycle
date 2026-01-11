-- Fix the donations.ngo_id Foreign Key to point to public.profiles
-- This enables the frontend to fetch NGO details using select('..., ngo:ngo_id(...)')

-- 1. Drop existing FK (which likely points to auth.users)
ALTER TABLE public.donations
DROP CONSTRAINT IF EXISTS donations_ngo_id_fkey;

-- 2. Add new FK pointing to public.profiles
ALTER TABLE public.donations
ADD CONSTRAINT donations_ngo_id_fkey
FOREIGN KEY (ngo_id) REFERENCES public.profiles(id);

-- Optional: Ensure RLS is still enabled (it should be)
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
