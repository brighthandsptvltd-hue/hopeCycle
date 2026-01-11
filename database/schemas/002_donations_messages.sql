-- schema to handle donations and chat messages
-- Execute this in the Supabase SQL Editor

-- Donations table
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    condition TEXT,
    location TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, PENDING, COMPLETED, CANCELLED
    ngo_id UUID REFERENCES auth.users(id), -- Null until claimed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Messages table (for direct chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID REFERENCES public.donations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NGO Requests table (for NGOs to post what they need)
CREATE TABLE IF NOT EXISTS public.ngo_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ngo_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'NORMAL', -- NORMAL, PRIORITY, URGENT
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent errors on re-run
DROP POLICY IF EXISTS "Public donations are viewable by everyone" ON public.donations;
DROP POLICY IF EXISTS "Users can create their own donations" ON public.donations;
DROP POLICY IF EXISTS "Donors can update their own donations" ON public.donations;
DROP POLICY IF EXISTS "NGOs can update donations they claim" ON public.donations;

DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

DROP POLICY IF EXISTS "NGO requests are viewable by everyone" ON public.ngo_requests;
DROP POLICY IF EXISTS "NGOs can create their own requests" ON public.ngo_requests;

-- Policies for Donations
CREATE POLICY "Public donations are viewable by everyone" ON public.donations
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own donations" ON public.donations
    FOR INSERT WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update their own donations" ON public.donations
    FOR UPDATE USING (auth.uid() = donor_id);

CREATE POLICY "NGOs can update donations they claim" ON public.donations
    FOR UPDATE USING (auth.uid() = ngo_id);

-- Policies for Messages
CREATE POLICY "Users can view messages they sent or received" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policies for NGO Requests
CREATE POLICY "NGO requests are viewable by everyone" ON public.ngo_requests
    FOR SELECT USING (true);

CREATE POLICY "NGOs can create their own requests" ON public.ngo_requests
    FOR INSERT WITH CHECK (auth.uid() = ngo_id);
