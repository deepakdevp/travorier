-- Migration: unlock_contact RPC
-- Atomic function that validates credits, deducts 1 credit, and unlocks match contact.
-- SECURITY DEFINER runs as superuser — client cannot bypass credit check.

CREATE OR REPLACE FUNCTION public.unlock_contact(p_match_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match        matches%ROWTYPE;
  v_credit_bal   INTEGER;
  v_txn_id       UUID;
BEGIN
  -- Lock match row to prevent double-unlock race condition
  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  -- Only the sender can unlock
  IF v_match.sender_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the sender can unlock contact';
  END IF;

  -- Idempotent: already unlocked, return success
  IF v_match.contact_unlocked THEN
    RETURN TRUE;
  END IF;

  -- Check credit balance (lock row to prevent concurrent deductions)
  SELECT credit_balance INTO v_credit_bal FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF v_credit_bal < 1 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Record transaction
  INSERT INTO transactions (user_id, transaction_type, amount, credits_used, match_id, payment_status)
  VALUES (auth.uid(), 'contact_unlock', 0, 1, p_match_id, 'succeeded')
  RETURNING id INTO v_txn_id;

  -- Deduct credit atomically
  UPDATE profiles SET credit_balance = credit_balance - 1 WHERE id = auth.uid();

  -- Unlock contact
  UPDATE matches
  SET contact_unlocked = TRUE,
      unlocked_at = NOW(),
      unlock_transaction_id = v_txn_id
  WHERE id = p_match_id;

  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.unlock_contact(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_contact(UUID) TO authenticated;
