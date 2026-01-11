-- FIX: Allow claiming of ACTIVE donations (Updates)

-- 1. DROP the incorrect update policy
DROP POLICY IF EXISTS "NGOs can update assigned donations" ON public.donations;

-- 2. CREATE the correct policy that allows claiming 'ACTIVE' items
CREATE POLICY "Allow claiming active donations" 
ON public.donations 
FOR UPDATE 
USING (
  status = 'ACTIVE'                -- You can update IF it's currently available
  OR 
  (auth.uid() = ngo_id)            -- OR if you already claimed it
);

-- 3. Ensure Select policy handles both cases too
DROP POLICY IF EXISTS "NGOs can view assigned donations" ON public.donations;
CREATE POLICY "NGOs can view assigned donations" 
ON public.donations 
FOR SELECT 
USING (
  status = 'ACTIVE'                -- Everyone can see available items
  OR 
  auth.uid() = ngo_id              -- You can see items you claimed
  OR
  auth.uid() = donor_id            -- Donors can see their own items
);
