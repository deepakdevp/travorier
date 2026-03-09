-- =====================================================
-- Tier 3: Chat Realtime Support
-- =====================================================

-- 1. Enable Realtime for messages table
--    Required for postgres_changes subscriptions in chat.tsx
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Fix messages SELECT policy
--    Old: requires contact_unlocked = true (blocks traveler from chatting)
--    New: allows chat when match status is agreed/in-progress
DROP POLICY IF EXISTS "Match participants can read messages" ON messages;

CREATE POLICY "Match participants can read messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
        AND (matches.traveler_id = auth.uid() OR matches.sender_id = auth.uid())
        AND matches.status IN ('agreed', 'handover_scheduled', 'in_transit', 'delivered')
    )
  );

-- 3. Fix messages INSERT policy
--    Old: requires contact_unlocked = true
--    New: allows sending when match is agreed/in-progress
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
    )
  );

-- 4. Allow match participants to mark received messages as read
CREATE POLICY "Match participants can mark messages read"
  ON messages FOR UPDATE
  USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
        AND (matches.traveler_id = auth.uid() OR matches.sender_id = auth.uid())
        AND matches.status IN ('agreed', 'handover_scheduled', 'in_transit', 'delivered')
    )
  )
  WITH CHECK (true);
