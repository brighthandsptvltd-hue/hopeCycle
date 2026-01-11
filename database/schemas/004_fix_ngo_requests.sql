-- Fix NGO Requests foreign key to allow joins with profiles
ALTER TABLE public.ngo_requests 
DROP CONSTRAINT IF EXISTS ngo_requests_ngo_id_fkey;

ALTER TABLE public.ngo_requests 
ADD CONSTRAINT ngo_requests_ngo_id_fkey 
FOREIGN KEY (ngo_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
