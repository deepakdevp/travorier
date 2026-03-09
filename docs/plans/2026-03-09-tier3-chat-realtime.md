# Tier 3: Chat (Supabase Realtime) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up real-time chat between matched senders and travelers using Supabase Realtime and the existing `messages` table.

**Architecture:** `chat.tsx` is already fully implemented (history load, Realtime subscribe, send). The blockers are: (1) Realtime not enabled on the `messages` table, (2) RLS policy incorrectly gates chat on `contact_unlocked = true` instead of `status = 'agreed'`, and (3) a minor accuracy fix in `my-trip-detail.tsx`. Three tasks total.

**Tech Stack:** Supabase Realtime (postgres_changes), Supabase SQL migrations, React Native, Zustand (requestsStore)

---

## Background

The `chat.tsx` screen already has all the code:
- `loadMessageHistory()` — fetches from `messages` table, ordered by `created_at ASC`
- `subscribeToMessages()` — Supabase Realtime channel `match:{matchId}`, listens for `INSERT` on `messages` filtered by `match_id`
- `sendMessage()` — inserts into `messages` with `match_id`, `sender_id`, `content`
- Chat lock logic — locks 24h after `trip.departure_date`

**Navigation to chat:**
- Sender path: `requests.tsx` "Chat" → `request-detail.tsx` → `unlockContact()` → `setSelectedMatch(...)` → `router.push('/chat')`
- Traveler path: `my-trip-detail.tsx` → Accept match → `respondToMatch('agreed')` → `setSelectedMatch(...)` → `router.push('/chat')`

**Two bugs blocking chat:**

### Bug 1: Realtime not enabled on `messages` table
Supabase Realtime requires tables to be added to the `supabase_realtime` publication. Without this, `.channel(...).on('postgres_changes', ...)` subscriptions never fire. The initial migration does not add `messages` to the publication.

### Bug 2: Messages RLS uses `contact_unlocked = true` instead of `status = 'agreed'`
Current policies:
```sql
-- read
AND matches.contact_unlocked = true

-- insert
AND matches.contact_unlocked = true
```
`contact_unlocked` is only set to `true` when the **sender** pays credits (via `unlock_contact` RPC). This means:
- The **traveler** can never send/receive messages (their contact is never "unlocked" from their own side)
- The sender can only chat AFTER paying, even if both parties agreed

Correct behavior: chat should be open to both parties once `status = 'agreed'`. `contact_unlocked` should only gate the **phone/email reveal** (Tier 4 credits feature).

### Bug 3: my-trip-detail.tsx hardcodes `contact_unlocked: true`
When the traveler accepts a match, `setSelectedMatch` hardcodes `contact_unlocked: true` in local state. This is inaccurate (DB has `false`) and misleading. After Bug 2 is fixed, chat works via `status = 'agreed'` so this becomes a correctness fix.

---

## Task 1: Create migration to fix RLS and enable Realtime

**Files:**
- Create: `supabase/migrations/20260309000001_chat_realtime.sql`

**Step 1: Write the migration**

Create `supabase/migrations/20260309000001_chat_realtime.sql`:

```sql
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
```

**Step 2: Verify SQL is correct**

Read the file back and confirm policy names match exactly what's in `20260215000001_initial_schema.sql` (they do: `"Match participants can read messages"` and `"Match participants can send messages"`).

**Step 3: Commit**

```bash
git add supabase/migrations/20260309000001_chat_realtime.sql
git commit -m "feat(chat): fix messages RLS and enable Supabase Realtime"
```

---

## Task 2: Apply migration to Supabase

**Files:**
- No new files — apply via Supabase CLI or Dashboard SQL Editor

**Step 1: Apply via Supabase CLI (preferred)**

```bash
cd /Users/deepak.panwar/personal/travorier
supabase db push
```

Expected output: `Applying migration 20260309000001_chat_realtime.sql...done`

**If Supabase CLI not installed or not linked:**

**Step 2 (fallback): Apply via Supabase Dashboard SQL Editor**

Open: https://supabase.com/dashboard/project/syjhflxtfcfavdacodgm/sql/new

Paste and run the exact SQL from Task 1.

**Step 3: Verify Realtime is enabled**

In Supabase Dashboard → Database → Replication → check that `messages` table appears under `supabase_realtime` publication.

**Step 4: Verify policies updated**

In Supabase Dashboard → Authentication → Policies → `messages` table — confirm the two policies now use `status IN (...)` not `contact_unlocked = true`.

---

## Task 3: Fix my-trip-detail.tsx — accurate contact_unlocked in selectedMatch

**Files:**
- Modify: `mobile/app/my-trip-detail.tsx` around line 119

**Context:** When the traveler accepts a match via `handleAccept`, `setSelectedMatch` is called with `contact_unlocked: true` hardcoded. After Task 1's RLS fix, chat access is determined by `status = 'agreed'`, so this hardcoding is inaccurate but harmless. Fix it for correctness.

**Step 1: Read the current code**

In `my-trip-detail.tsx` find the `setSelectedMatch({...})` call inside `handleAccept`:

```typescript
setSelectedMatch({
  id: match.id,
  request_id: match.request_id,
  trip_id: match.trip_id,
  traveler: { ... },
  trip: { ... },
  agreed_weight_kg: match.agreed_weight_kg,
  status: 'agreed',
  contact_unlocked: true,  // ← hardcoded incorrectly
});
```

**Step 2: Fix contact_unlocked**

Change `contact_unlocked: true` → `contact_unlocked: match.contact_unlocked`:

```typescript
setSelectedMatch({
  id: match.id,
  request_id: match.request_id,
  trip_id: match.trip_id,
  traveler: { ... },
  trip: { ... },
  agreed_weight_kg: match.agreed_weight_kg,
  status: 'agreed',
  contact_unlocked: match.contact_unlocked,
});
```

**Step 3: Run typecheck**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck
```

Expected: no new errors (pre-existing 3 errors are fine — see MEMORY.md).

**Step 4: Commit**

```bash
git add mobile/app/my-trip-detail.tsx
git commit -m "fix(chat): use accurate contact_unlocked from match in my-trip-detail"
```

**Step 5: Push**

```bash
git push origin main
```

---

## Task 4: Mark messages as read when chat opens

**Files:**
- Modify: `mobile/app/chat.tsx` — inside `loadMessageHistory()`

**Context:** The `messages` table has a `read_at` column (nullable timestamp). When the current user opens a chat, all unread messages from the *other* party should be marked as read. This enables future unread counts/badges.

**Step 1: Add markMessagesRead after loading history**

In `chat.tsx`, after `setMessages(data ?? [])`, call a new `markMessagesRead` function:

```typescript
const markMessagesRead = async () => {
  if (!user) return;
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .neq('sender_id', user.id)
    .is('read_at', null);
};
```

Call it inside `loadMessageHistory()` after setting messages:

```typescript
const loadMessageHistory = async () => {
  setLoadingHistory(true);
  setLoadError(false);
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) {
      setLoadError(true);
    } else {
      setMessages(data ?? []);
      markMessagesRead();  // ← add this (fire and forget)
    }
  } catch (err) {
    setLoadError(true);
  } finally {
    setLoadingHistory(false);
  }
};
```

Also add the RLS policy for UPDATE in the same migration (Task 1). Add to `20260309000001_chat_realtime.sql`:

```sql
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
```

> Note: Add this to the migration file BEFORE applying in Task 2. If Task 2 is already applied, run the UPDATE policy SQL separately in the Dashboard SQL Editor.

**Step 2: Run typecheck**

```bash
export PATH="$HOME/.nvm/versions/node/v20.14.0/bin:$PATH" && cd /Users/deepak.panwar/personal/travorier/mobile && npm run typecheck
```

Expected: no new errors.

**Step 3: Commit**

```bash
git add mobile/app/chat.tsx
git commit -m "feat(chat): mark received messages as read on chat open"
```

**Step 4: Push**

```bash
git push origin main
```

---

## Pre-existing TypeScript errors to ignore

These 3 errors existed before Tier 3 — do not fix them:
- `app/(tabs)/index.tsx` — icon name typo `'package-variant-plus'`
- `app/match-confirmation.tsx` — missing lottie-react-native types
- `app/trip-detail.tsx` — icon name typo `'package-variant-closed-check'`

---

## End-to-end test checklist

After all tasks are done:

**Sender flow:**
1. Create a request → trip matches → go to `request-detail`
2. Tap "Accept & Chat" → `unlockContact()` fires → navigates to chat
3. Send a message → see it appear in chat
4. Open chat on another device/tab as traveler → message appears in real-time

**Traveler flow:**
1. Post a trip → sender creates a match request → go to `my-trip-detail`
2. Tap "Accept & Chat" → navigates to chat
3. Send a message → see it appear
4. Sender opens chat → message appears in real-time

**Chat lock:**
5. Set `trip.departure_date` to yesterday → reopen chat → input bar is disabled, "Chat is locked" banner shows
