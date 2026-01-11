-- Create a bucket for NGO verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verifications', 'verifications', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the verifications bucket
CREATE POLICY "Verification documents are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'verifications' );

CREATE POLICY "Users can upload verification documents."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'verifications' AND auth.role() = 'authenticated' );

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
