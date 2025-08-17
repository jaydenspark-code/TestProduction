-- CUSTOM REGISTRATION WITH EXISTING EDGE FUNCTIONS
-- This integrates with your existing Edge Functions for email verification
-- Run this SQL in Supabase to set up the database properly

BEGIN;

-- ===== STEP 1: Ensure email_verification_codes table exists =====

-- Drop and recreate table to ensure clean state (from your old SQL)
DROP TABLE IF EXISTS public.email_verification_codes CASCADE;

CREATE TABLE public.email_verification_codes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    code VARCHAR(6) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ NULL,
    attempts INTEGER DEFAULT 0
);

-- Grant permissions for Edge Functions
GRANT ALL ON TABLE public.email_verification_codes TO service_role;
GRANT ALL ON SEQUENCE public.email_verification_codes_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.email_verification_codes TO authenticated;
GRANT SELECT ON TABLE public.email_verification_codes TO anon;

-- Enable RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow service role full access" ON public.email_verification_codes;
CREATE POLICY "Allow service role full access" 
ON public.email_verification_codes 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert their own codes" ON public.email_verification_codes;
CREATE POLICY "Allow authenticated users to insert their own codes" 
ON public.email_verification_codes 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to read verification codes" ON public.email_verification_codes;
CREATE POLICY "Allow users to read verification codes" 
ON public.email_verification_codes 
FOR SELECT 
TO authenticated, anon
USING (true);

-- ===== STEP 2: Create store_verification_code function =====

CREATE OR REPLACE FUNCTION public.store_verification_code(
    p_user_id UUID,
    p_email TEXT,
    p_code TEXT
)
RETURNS JSON AS $$
BEGIN
    -- Insert the verification code
    INSERT INTO public.email_verification_codes (user_id, email, code, expires_at, created_at)
    VALUES (
        p_user_id,
        p_email,
        p_code,
        NOW() + INTERVAL '15 minutes',
        NOW()
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Verification code stored successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.store_verification_code TO service_role, authenticated, anon;

-- ===== STEP 3: Update verify_email_code function =====

CREATE OR REPLACE FUNCTION public.verify_email_code(verification_code TEXT)
RETURNS JSON AS $$
DECLARE
    code_record RECORD;
    user_record RECORD;
BEGIN
    -- Log the function call
    RAISE NOTICE 'verify_email_code called with code: %', verification_code;
    
    -- Find the code (case-insensitive)
    SELECT * INTO code_record 
    FROM public.email_verification_codes 
    WHERE UPPER(code) = UPPER(verification_code)
    AND used_at IS NULL 
    AND expires_at > NOW()
    AND attempts < 5  -- Max 5 attempts
    LIMIT 1;
    
    -- Increment attempt counter for this code
    UPDATE public.email_verification_codes 
    SET attempts = attempts + 1 
    WHERE UPPER(code) = UPPER(verification_code);
    
    -- Check if code was found
    IF code_record IS NULL THEN
        RAISE NOTICE 'Code not found, expired, or too many attempts';
        
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired verification code'
        );
    END IF;
    
    RAISE NOTICE 'Found valid code for user: % email: %', code_record.user_id, code_record.email;
    
    -- Mark code as used
    UPDATE public.email_verification_codes 
    SET used_at = NOW() 
    WHERE id = code_record.id;
    
    -- Update user's email verification status
    UPDATE public.users 
    SET is_verified = true,
        updated_at = NOW()
    WHERE id = code_record.user_id;
    
    -- Get user data to return
    SELECT * INTO user_record 
    FROM public.users 
    WHERE id = code_record.user_id;
    
    RAISE NOTICE 'Code verified successfully for user: %', code_record.user_id;
    
    -- Return success with user data
    RETURN json_build_object(
        'success', true,
        'email', code_record.email,
        'user_id', code_record.user_id,
        'user_data', row_to_json(user_record),
        'message', 'Email verified successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in verify_email_code: %', SQLERRM;
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_email_code TO anon, authenticated, service_role;

-- ===== STEP 4: Remove the auth trigger (we'll do manual user creation) =====

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ===== STEP 5: Update RLS policies for manual user creation =====

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated user creation" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow OAuth user creation" ON public.users;
DROP POLICY IF EXISTS "Allow OAuth user upsert" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Allow user registration and OAuth creation" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "Trigger can insert users" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create new policies for manual user registration
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage all users (for Edge Functions)
CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL USING (current_setting('role') = 'service_role');

-- Allow authenticated users to create their own profiles during registration
CREATE POLICY "Allow user self-registration" ON public.users
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated, anon, service_role;

-- Check if referrals table exists and grant permissions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') THEN
        GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated, anon, service_role;
    END IF;
END $$;

-- ===== STEP 6: Create registration function for Edge Functions =====

CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_country TEXT DEFAULT 'US',
    p_currency TEXT DEFAULT 'USD',
    p_phone TEXT DEFAULT NULL,
    p_referral_code TEXT DEFAULT NULL,
    p_referred_by TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    referrer_user_id UUID;
    final_referral_code TEXT;
BEGIN
    -- Generate referral code if not provided
    IF p_referral_code IS NULL THEN
        final_referral_code := 'USR' || upper(substr(replace(p_user_id::text, '-', ''), 1, 10));
    ELSE
        final_referral_code := p_referral_code;
    END IF;
    
    -- Find referrer if referred_by code exists
    IF p_referred_by IS NOT NULL THEN
        SELECT id INTO referrer_user_id
        FROM public.users
        WHERE referral_code = p_referred_by;
    END IF;
    
    -- Insert new user into public.users table
    INSERT INTO public.users (
        id,
        email,
        full_name,
        country,
        currency,
        phone,
        referral_code,
        referred_by,
        is_verified,
        is_paid,
        role,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        p_full_name,
        p_country,
        p_currency,
        p_phone,
        final_referral_code,
        referrer_user_id,
        false, -- Will be true after email verification
        false,
        'user',
        NOW(),
        NOW()
    );
    
    -- Create referral record if user was referred
    IF referrer_user_id IS NOT NULL THEN
        INSERT INTO referrals (
            referrer_id,
            referred_user_id,
            referral_code,
            status,
            created_at
        ) VALUES (
            referrer_user_id,
            p_user_id,
            p_referred_by,
            'pending',
            NOW()
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'user_id', p_user_id,
        'message', 'User profile created successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_user_profile TO service_role, authenticated, anon;

-- ===== STEP 7: Verify the setup =====

-- Check policies
SELECT 'RLS Policies:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Check functions
SELECT 'Functions created:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name IN ('store_verification_code', 'verify_email_code', 'create_user_profile');

-- Check email verification table
SELECT 'Email verification table:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'email_verification_codes'
ORDER BY ordinal_position;

COMMIT;

SELECT '✅ Custom registration system ready for Edge Functions!' as result;
