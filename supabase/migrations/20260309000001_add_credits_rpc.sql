-- supabase/migrations/20260309000001_add_credits_rpc.sql
-- RPC to atomically add credits to a user's balance (called by backend service role)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_credits INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF p_credits <= 0 THEN
    RAISE EXCEPTION 'Credits must be positive';
  END IF;

  UPDATE profiles
  SET
    credit_balance = credit_balance + p_credits,
    total_credits_purchased = total_credits_purchased + p_credits
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  RETURN v_new_balance;
END;
$$;

-- Only backend service role can call this directly
-- (the function is SECURITY DEFINER so it runs as owner)
REVOKE ALL ON FUNCTION public.add_credits FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_credits TO service_role;
