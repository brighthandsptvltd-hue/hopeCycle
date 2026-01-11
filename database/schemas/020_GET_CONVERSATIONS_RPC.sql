-- RPC to get list of conversations, INCLUDING assigned NGOs even if no messages exist yet

CREATE OR REPLACE FUNCTION get_conversations()
RETURNS TABLE (
    user_id uuid,
    full_name text,
    organization_name text,
    role text,
    last_message text,
    last_message_time timestamptz,
    unread_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- 1. Partners from existing messages
    message_partners AS (
        SELECT DISTINCT 
            CASE WHEN sender_id = auth.uid() THEN receiver_id ELSE sender_id END as partner_id
        FROM messages
        WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
    ),
    -- 2. Partners from assigned donations (NGOs linked to me)
    donation_partners AS (
        SELECT DISTINCT ngo_id as partner_id
        FROM donations
        WHERE donor_id = auth.uid() 
        AND ngo_id IS NOT NULL 
        AND status IN ('PENDING', 'COMPLETED')
    ),
    -- 3. Combine unique partners
    all_partners AS (
        SELECT partner_id FROM message_partners
        UNION
        SELECT partner_id FROM donation_partners
    ),
    -- 4. Get latest message details
    latest_messages AS (
        SELECT DISTINCT ON (
            CASE WHEN sender_id = auth.uid() THEN receiver_id ELSE sender_id END
        )
            CASE WHEN sender_id = auth.uid() THEN receiver_id ELSE sender_id END as partner_id,
            content,
            created_at
        FROM messages
        WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
        ORDER BY partner_id, created_at DESC
    ),
    -- 5. Get unread counts
    unread_counts AS (
        SELECT sender_id as partner_id, count(*) as cnt
        FROM messages
        WHERE receiver_id = auth.uid() AND is_read = false
        GROUP BY sender_id
    )
    -- 6. Final Select
    SELECT
        p.id AS user_id,
        p.full_name,
        p.organization_name,
        p.role,
        COALESCE(lm.content, 'Start a conversation') AS last_message,
        lm.created_at AS last_message_time,
        COALESCE(u.cnt, 0) AS unread_count
    FROM all_partners ap
    JOIN profiles p ON p.id = ap.partner_id
    LEFT JOIN latest_messages lm ON lm.partner_id = ap.partner_id
    LEFT JOIN unread_counts u ON u.partner_id = ap.partner_id
    ORDER BY lm.created_at DESC NULLS FIRST; -- Put new matched partners at the top (or bottom, NULLS FIRST usually puts them top)
END;
$$;
