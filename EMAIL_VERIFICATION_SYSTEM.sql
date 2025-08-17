-- COMPLETE EMAIL VERIFICATION SYSTEM SETUP
-- This creates the full email verification system including tables, functions, and integration
-- Copy and paste this EXACT SQL and run it:

BEGIN;

-- ===== PART 1: CREATE EMAIL VERIFICATION TABLES =====

-- Drop and recreate email verification codes table
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

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_user_id ON public.email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code ON public.email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON public.email_verification_codes(email);

-- ===== PART 2: GRANT PERMISSIONS =====

-- Grant ALL permissions to service_role (crucial for Edge Functions)
GRANT ALL ON TABLE public.email_verification_codes TO service_role;
GRANT ALL ON SEQUENCE public.email_verification_codes_id_seq TO service_role;

-- Grant specific permissions to other roles
GRANT SELECT, INSERT, UPDATE ON TABLE public.email_verification_codes TO authenticated;
GRANT SELECT, INSERT ON TABLE public.email_verification_codes TO anon;

-- ===== PART 3: ENABLE RLS AND CREATE POLICIES =====

-- Enable RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies
DROP POLICY IF EXISTS "Allow service role full access" ON public.email_verification_codes;
CREATE POLICY "Allow service role full access" 
ON public.email_verification_codes 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to manage verification codes" ON public.email_verification_codes;
CREATE POLICY "Allow users to manage verification codes" 
ON public.email_verification_codes 
FOR ALL 
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- ===== PART 4: CREATE VERIFICATION FUNCTIONS =====

-- Function to store verification code
CREATE OR REPLACE FUNCTION public.store_verification_code(
    p_user_id UUID,
    p_email TEXT,
    p_code TEXT
)
RETURNS JSON AS $$
DECLARE
    code_id INTEGER;
BEGIN
    -- Delete any existing codes for this user/email
    DELETE FROM public.email_verification_codes 
    WHERE user_id = p_user_id OR email = p_email;
    
    -- Insert new verification code
    INSERT INTO public.email_verification_codes (user_id, email, code, expires_at, created_at)
    VALUES (
        p_user_id,
        p_email,
        p_code,
        NOW() + INTERVAL '15 minutes',
        NOW()
    ) RETURNING id INTO code_id;
    
    RETURN json_build_object(
        'success', true,
        'code_id', code_id,
        'message', 'Verification code stored successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify email code
CREATE OR REPLACE FUNCTION public.verify_email_code(verification_code TEXT)
RETURNS JSON AS $$
DECLARE
    code_record RECORD;
    user_record RECORD;
BEGIN
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
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired verification code'
        );
    END IF;
    
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
    
    -- Return success with user data
    RETURN json_build_object(
        'success', true,
        'email', code_record.email,
        'user_id', code_record.user_id,
        'user_data', row_to_json(user_record),
        'message', 'Email verified successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.store_verification_code TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.verify_email_code TO service_role, authenticated, anon;

-- ===== PART 5: UPDATE USER CREATION TRIGGER TO STORE VERIFICATION CODE =====

-- Update the handle_new_user function to also create verification code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_metadata JSONB;
    user_country TEXT := 'US';
    user_currency TEXT := 'USD';
    user_full_name TEXT := 'Unknown User';
    user_referral_code TEXT;
    referred_by_code TEXT;
    referrer_user_id UUID;
    user_phone TEXT;
    verification_code TEXT;
BEGIN
    -- Extract metadata from new user
    user_metadata := NEW.raw_user_meta_data;
    
    -- Extract user information from metadata
    IF user_metadata IS NOT NULL THEN
        user_full_name := COALESCE(
            user_metadata->>'full_name',
            user_metadata->>'fullName', 
            user_metadata->>'name',
            'Unknown User'
        );
        user_country := COALESCE(user_metadata->>'country', 'US');
        user_currency := COALESCE(user_metadata->>'currency', 'USD');
        user_phone := user_metadata->>'phone';
        referred_by_code := user_metadata->>'referred_by';
        user_referral_code := COALESCE(
            user_metadata->>'referral_code',
            'USR' || upper(substr(replace(NEW.id::text, '-', ''), 1, 10))
        );
    ELSE
        -- Generate referral code from user ID if no metadata
        user_referral_code := 'USR' || upper(substr(replace(NEW.id::text, '-', ''), 1, 10));
    END IF;
    
    -- Find referrer if referred_by code exists
    IF referred_by_code IS NOT NULL THEN
        SELECT id INTO referrer_user_id
        FROM users
        WHERE referral_code = referred_by_code;
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
        NEW.id,
        NEW.email,
        user_full_name,
        user_country,
        user_currency,
        user_phone,
        user_referral_code,
        referrer_user_id,
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        false,
        'user',
        NEW.created_at,
        NEW.created_at
    );
    
    -- Generate verification code (6 characters: 4 digits + 2 letters)
    verification_code := (
        -- 4 random digits
        floor(random() * 10)::text ||
        floor(random() * 10)::text ||
        floor(random() * 10)::text ||
        floor(random() * 10)::text ||
        -- 2 random letters
        chr(65 + floor(random() * 26)::int) ||
        chr(65 + floor(random() * 26)::int)
    );
    
    -- Store verification code
    INSERT INTO public.email_verification_codes (user_id, email, code, expires_at, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        verification_code,
        NOW() + INTERVAL '15 minutes',
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
            NEW.id,
            referred_by_code,
            'pending',
            NOW()
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE LOG 'Error creating user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

-- ===== PART 6: TEST THE SYSTEM =====

-- Test verification code storage
DO $$
DECLARE
    test_result JSON;
BEGIN
    -- Test storing a verification code
    SELECT public.store_verification_code(
        gen_random_uuid(),
        'test@example.com',
        'TEST01'
    ) INTO test_result;
    
    IF (test_result->>'success')::boolean THEN
        RAISE NOTICE '✅ Verification code storage test passed';
    ELSE
        RAISE NOTICE '❌ Verification code storage test failed: %', test_result->>'error';
    END IF;
    
    -- Clean up test data
    DELETE FROM public.email_verification_codes WHERE email = 'test@example.com';
END $$;

-- Show table structure
SELECT 'Email verification codes table structure:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'email_verification_codes'
ORDER BY ordinal_position;

COMMIT;

SELECT '✅ Complete email verification system created!' as result;
