-- =====================================================
-- Tier 3: Chat Realtime Support
-- =====================================================

-- 1. Enable Realtime for messages table
--    Required for postgres_changes subscriptions in chat.tsx
--    Guarded for idempotency: skipped if messages is already in the publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- 2. Fix messages SELECT policy
--    Old: requires contact_unlocked = true (blocks traveler from chatting)
--    New: allows chat when match status is agreed/in-progress
--    Note: 'negotiating' is intentionally excluded — it is not used in the chat flow.
DROP POLICY IF EXISTS "Match participants can read messages" ON messages;

CREATE POLICY "Match participants can read messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
        AND (matches.traveler_id = auth.uid() OR matches.sender_id = auth.uid())
        AND matches.status IN ('agreed', 'handover_scheduled', 'in_transit', 'delivered')
        -- 'negotiating' intentionally excluded: chat is only available for agreed+ matches
    )
  );

-- 3. Fix messages INSERT policy
--    Old: requires contact_unlocked = true
--    New: allows sending when match is agreed/in-progress
--    Note: 'negotiating' is intentionally excluded — it is not used in the chat flow.
DROP POLICY IF EXISTS "Match participants can send messages" ON messages;

CREATE POLICY "Match participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_id
        AND (matches.traveler_id = auth.uid() OR matches.sender_id = auth.uid())
        AND matches.status IN ('agreed', 'handover_scheduled', 'in_transit', 'delivered')
        -- 'negotiating' intentionally excluded: chat is only available for agreed+ matches
    )
  );

-- 4. RPC function to mark received messages as read (SECURITY DEFINER to bypass RLS)
--    Replaces a direct UPDATE policy to prevent unrestricted column writes.
--    In mobile/app/chat.tsx, call via: supabase.rpc('mark_messages_read', { p_match_id: matchId })
--    (The previous direct UPDATE must be replaced with this RPC call in Task 4.)
CREATE OR REPLACE FUNCTION mark_messages_read(p_match_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only mark messages from the other party (not the caller's own messages)
  UPDATE messages
  SET read_at = NOW()
  WHERE match_id = p_match_id
    AND sender_id != auth.uid()
    AND read_at IS NULL
    AND EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = p_match_id
        AND (matches.traveler_id = auth.uid() OR matches.sender_id = auth.uid())
        AND matches.status IN ('agreed', 'handover_scheduled', 'in_transit', 'delivered')
    );
END;
$$;

GRANT EXECUTE ON FUNCTION mark_messages_read(UUID) TO authenticated;
