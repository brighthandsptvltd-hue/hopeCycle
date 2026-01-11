-- COMPREHENSIVE FIX for ngo_requests table
-- Adds ALL columns potentially used by the app

DO $$ 
BEGIN 
    -- 1. Status Column (ACTIVE, COMPLETED, etc.)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_requests' AND column_name = 'status') THEN 
        ALTER TABLE public.ngo_requests ADD COLUMN status text DEFAULT 'ACTIVE'; 
    END IF;

    -- 2. Priority Column (High, Medium, Low)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_requests' AND column_name = 'priority') THEN 
        ALTER TABLE public.ngo_requests ADD COLUMN priority text DEFAULT 'Medium'; 
    END IF;

    -- 3. Category Column (Furniture, etc.) - re-verifying
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_requests' AND column_name = 'category') THEN 
        ALTER TABLE public.ngo_requests ADD COLUMN category text DEFAULT 'General'; 
    END IF;

    -- 4. Title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_requests' AND column_name = 'title') THEN 
        ALTER TABLE public.ngo_requests ADD COLUMN title text; 
    END IF;

    -- 5. Description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_requests' AND column_name = 'description') THEN 
        ALTER TABLE public.ngo_requests ADD COLUMN description text; 
    END IF;

    -- 6. NGO ID (Foreign Key)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_requests' AND column_name = 'ngo_id') THEN 
        ALTER TABLE public.ngo_requests ADD COLUMN ngo_id uuid REFERENCES auth.users(id); 
    END IF;

END $$;

-- 7. Ensure RLS is enabled and allows access
ALTER TABLE public.ngo_requests ENABLE ROW LEVEL SECURITY;

-- Policy to allow Creating requests
DROP POLICY IF EXISTS "NGOs can insert requests" ON public.ngo_requests;
CREATE POLICY "NGOs can insert requests" ON public.ngo_requests FOR INSERT WITH CHECK (auth.uid() = ngo_id);

-- Policy to allow Viewing requests
DROP POLICY IF EXISTS "NGOs can view own requests" ON public.ngo_requests;
CREATE POLICY "NGOs can view own requests" ON public.ngo_requests FOR SELECT USING (auth.uid() = ngo_id);
