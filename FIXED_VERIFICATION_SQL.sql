-- 🔧 FIXED: Email Verification Database Setup (Updated to 6-Character Code System)
-- This version uses the new 6-character verification code system

-- Step 1: Drop the old token-based system and any existing verify_email_code functions
DROP FUNCTION IF EXISTS public.verify_email_token(TEXT);
DROP FUNCTION IF EXISTS public.verify_email_code(TEXT);
DROP FUNCTION IF EXISTS public.verify_email_code(TEXT, TEXT);
DROP TABLE IF EXISTS public.email_verification_tokens;

-- Step 2: Create the new 6-character verification codes table
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    code VARCHAR(6) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ NULL,
    attempts INTEGER DEFAULT 0
);

-- Step 3: Create the verification function for 6-character codes
CREATE OR REPLACE FUNCTION public.verify_email_code(verification_code TEXT)
RETURNS JSON AS $$
DECLARE
    code_record RECORD;
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
    IF NOT FOUND THEN
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
    
    -- Update user's email verification status in auth.users
    UPDATE auth.users 
    SET email_confirmed_at = NOW()
    WHERE id = code_record.user_id
    AND email_confirmed_at IS NULL;
    
    -- Also update in public.users table if it exists
    UPDATE public.users 
    SET is_verified = true
    WHERE id = code_record.user_id;
    
    RAISE NOTICE 'Code verified successfully for user: %', code_record.user_id;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'email', code_record.email,
        'user_id', code_record.user_id,
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

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.verify_email_code TO anon, authenticated, service_role;

-- Step 5: Enable RLS on the codes table
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for the codes table
DROP POLICY IF EXISTS "Allow service role full access to email_verification_codes" ON public.email_verification_codes;
CREATE POLICY "Allow service role full access to email_verification_codes" 
ON public.email_verification_codes 
FOR ALL 
TO service_role 
USING (true);

-- Step 7: Check current verification codes (shows the new system)
SELECT 
    id,
    email,
    code,
    expires_at,
    created_at,
    used_at,
    attempts,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRED'
        WHEN used_at IS NOT NULL THEN 'USED'
        WHEN attempts >= 5 THEN 'TOO_MANY_ATTEMPTS'
        ELSE 'VALID'
    END as status,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as age_minutes
FROM public.email_verification_codes 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 8: Test the function with a dummy code
SELECT verify_email_code('3A7B92') as test_result;
