-- Fix RLS to allow receivers to update message status (mark as read)
-- This is critical for the unread count badge to work correctly.

-- Drop existing restricted policies if any (safeguard)
DROP POLICY IF EXISTS "Receivers can update messages" ON public.messages;

-- Allow users to update messages sent TO them (e.g. changing is_read)
CREATE POLICY "Receivers can update messages"
    ON public.messages
    FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- Also ensure users can see messages they are involved in (likely exists but reinforcing)
-- DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
-- CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
