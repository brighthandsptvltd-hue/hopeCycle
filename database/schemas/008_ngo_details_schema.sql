-- Add more fields to profiles for NGO verification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS representative_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS certificate_number TEXT,
ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- Update the handle_new_user function to be safe with these new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    location, 
    verification_status, 
    payment_status,
    latitude,
    longitude,
    representative_name,
    phone_number,
    certificate_number,
    certificate_url
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'), 
    COALESCE(new.raw_user_meta_data->>'role', 'DONOR'),
    COALESCE(new.raw_user_meta_data->>'location', 'Unknown'),
    'UNVERIFIED',
    'UNPAID',
    (new.raw_user_meta_data->>'latitude')::double precision,
    (new.raw_user_meta_data->>'longitude')::double precision,
    new.raw_user_meta_data->>'representative_name',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'certificate_number',
    new.raw_user_meta_data->>'certificate_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
