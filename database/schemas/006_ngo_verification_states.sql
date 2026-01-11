-- Add verification and payment status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'APPROVED', 'REJECTED', 'VERIFIED'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID'));

-- Ensure NGO status is correctly set
-- UNVERIFIED: Just signed up
-- PENDING: Form submitted, waiting for admin
-- APPROVED: Admin approved, waiting for payment
-- VERIFIED: Payment done, full access

-- Update RLS for profiles to allow users to update their own verification status (to PENDING)
CREATE POLICY "Users can update their own verification status." ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
