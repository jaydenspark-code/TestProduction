-- Function to create user profile bypassing RLS
-- This should be run as superuser/service role in Supabase

CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_country TEXT,
  user_currency TEXT DEFAULT 'USD',
  user_referral_code TEXT DEFAULT NULL,
  user_referred_by TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    country,
    currency,
    referral_code,
    referred_by,
    is_verified,
    is_paid,
    role,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    user_full_name,
    user_country,
    user_currency,
    user_referral_code,
    user_referred_by,
    false,
    false,
    'user',
    NOW(),
    NOW()
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile TO anon;
