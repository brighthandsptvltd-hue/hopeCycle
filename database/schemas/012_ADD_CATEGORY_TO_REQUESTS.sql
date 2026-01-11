-- Add missing category column to ngo_requests
ALTER TABLE public.ngo_requests 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'General';

-- Ensure RLS allows inserting
ALTER TABLE public.ngo_requests ENABLE ROW LEVEL SECURITY;

-- Allow NGO to insert their own requests
DROP POLICY IF EXISTS "NGOs can create requests" ON public.ngo_requests;
CREATE POLICY "NGOs can create requests" 
ON public.ngo_requests 
FOR INSERT 
WITH CHECK (auth.uid() = ngo_id);

-- Allow NGO to view their own requests
DROP POLICY IF EXISTS "NGOs can view own requests" ON public.ngo_requests;
CREATE POLICY "NGOs can view own requests" 
ON public.ngo_requests 
FOR SELECT 
USING (auth.uid() = ngo_id);
