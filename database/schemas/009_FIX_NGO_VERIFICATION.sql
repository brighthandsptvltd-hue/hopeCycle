-- IMPORTANT: Run this SQL in Supabase SQL Editor FIRST before using NGO verification!

-- Add the missing NGO verification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS representative_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS certificate_number TEXT,
ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- If you need to reset a specific NGO's verification to allow resubmission, use this:
-- UPDATE public.profiles 
-- SET verification_status = 'UNVERIFIED',
--     representative_name = NULL,
--     phone_number = NULL,
--     certificate_number = NULL,
--     certificate_url = NULL
-- WHERE id = 'PASTE_NGO_USER_ID_HERE';

-- To find the NGO user ID, run:
-- SELECT id, full_name, email, organization_name, verification_status 
-- FROM auth.users 
-- JOIN public.profiles ON auth.users.id = public.profiles.id
-- WHERE role = 'NGO';
