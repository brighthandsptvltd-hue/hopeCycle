-- Create table to track NGO interests in active donations
CREATE TABLE IF NOT EXISTS public.donation_interests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    donation_id uuid REFERENCES public.donations(id) ON DELETE CASCADE,
    ngo_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    status text DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
    message text -- Optional message from NGO
);

-- Enable RLS
ALTER TABLE public.donation_interests ENABLE ROW LEVEL SECURITY;

-- Allow NGOs to insert their own interest
CREATE POLICY "NGOs can express interest" 
ON public.donation_interests 
FOR INSERT 
WITH CHECK (auth.uid() = ngo_id);

-- Allow NGOs to view their own interests
CREATE POLICY "NGOs can view own interests" 
ON public.donation_interests 
FOR SELECT 
USING (auth.uid() = ngo_id);

-- Allow Donors to view interests for their own donations
CREATE POLICY "Donors can view interests on their items" 
ON public.donation_interests 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.donations d 
        WHERE d.id = donation_interests.donation_id 
        AND d.donor_id = auth.uid()
    )
);

-- Allow Donors to update status (Accept/Reject)
CREATE POLICY "Donors can update interests" 
ON public.donation_interests 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.donations d 
        WHERE d.id = donation_interests.donation_id 
        AND d.donor_id = auth.uid()
    )
);
