-- Fix the Foreign Key to point to profiles directly, enabling easy frontend joins
ALTER TABLE public.donation_interests
DROP CONSTRAINT IF EXISTS donation_interests_ngo_id_fkey;

ALTER TABLE public.donation_interests
ADD CONSTRAINT donation_interests_ngo_id_fkey
FOREIGN KEY (ngo_id) REFERENCES public.profiles(id);

-- Ensure the relationship to donations is also clear (already done in 014 but reinforcing)
-- No change needed for donation_id if 014 was run.

-- Re-apply RLS policies just in case (optional, but good for safety)
ALTER TABLE public.donation_interests ENABLE ROW LEVEL SECURITY;
