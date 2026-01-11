-- Migration to move legacy direct claims to donation_interests table

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find all donations that are currently 'PENDING' or 'ACTIVE' but have an ngo_id assigned
    -- (This means they were claimed using the old method)
    FOR r IN SELECT * FROM public.donations WHERE ngo_id IS NOT NULL AND status IN ('PENDING', 'ACTIVE') LOOP
        
        -- 1. Create a request record in the new table
        INSERT INTO public.donation_interests (donation_id, ngo_id, status)
        VALUES (r.id, r.ngo_id, 'PENDING');
        
        -- 2. Reset the donation to 'ACTIVE' and plain state
        -- This allows the donor to see it as an incoming request and "Accept" it formally
        UPDATE public.donations
        SET status = 'ACTIVE', ngo_id = NULL
        WHERE id = r.id;
        
    END LOOP;
END $$;
