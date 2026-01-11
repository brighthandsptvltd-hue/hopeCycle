-- Fix the donations.donor_id Foreign Key to point to public.profiles
-- This enables the frontend to fetch Donor details using select('..., donor:donor_id(...)')

-- 1. Drop existing FK (which likely points to auth.users)
ALTER TABLE public.donations
DROP CONSTRAINT IF EXISTS donations_donor_id_fkey;

-- 2. Add new FK pointing to public.profiles
ALTER TABLE public.donations
ADD CONSTRAINT donations_donor_id_fkey
FOREIGN KEY (donor_id) REFERENCES public.profiles(id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
