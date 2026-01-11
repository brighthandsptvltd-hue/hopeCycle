-- FIX: Allow NGOs to see the donations they have claimed!

-- 1. Enable RLS (just in case)
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- 2. Drop the policy if it exists to avoid conflicts (safe errors if it doesn't exist)
DROP POLICY IF EXISTS "NGOs can view assigned donations" ON public.donations;

-- 3. Create the policy to allow NGOs to see ANY donation assigned to them
CREATE POLICY "NGOs can view assigned donations" 
ON public.donations 
FOR SELECT 
USING (auth.uid() = ngo_id);

-- 4. Also ensure they can UPDATE the status (e.g. to COMPLETED)
DROP POLICY IF EXISTS "NGOs can update assigned donations" ON public.donations;

CREATE POLICY "NGOs can update assigned donations" 
ON public.donations 
FOR UPDATE 
USING (auth.uid() = ngo_id);
