-- Secure Function to fetch pending requests for the current donor
-- Fixed to remove reference to non-existent category column

CREATE OR REPLACE FUNCTION get_donor_requests()
RETURNS TABLE (
    interest_id uuid,
    status text,
    created_at timestamptz,
    donation_id uuid,
    donation_title text,
    ngo_id uuid,
    ngo_name text
    -- Removed ngo_category as it does not exist in profiles table
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    di.id AS interest_id,
    di.status,
    di.created_at,
    d.id AS donation_id,
    d.title AS donation_title,
    p.id AS ngo_id,
    COALESCE(p.organization_name, p.full_name) AS ngo_name
  FROM donation_interests di
  JOIN donations d ON di.donation_id = d.id
  JOIN profiles p ON di.ngo_id = p.id
  WHERE d.donor_id = auth.uid() -- Only show requests for my donations
  AND di.status = 'PENDING'     -- Only show pending requests
  ORDER BY di.created_at DESC;
$$;
