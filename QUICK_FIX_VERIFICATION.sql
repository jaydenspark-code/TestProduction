-- 🔧 QUICK FIX: Email Verification Database Setup
-- Run this in your Supabase SQL Editor to fix verification issues

-- Step 1: Ensure the email_verification_tokens table exists
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ NULL
);

-- Step 2: Create or replace the verification function
CREATE OR REPLACE FUNCTION public.verify_email_token(verification_token TEXT)
RETURNS JSON AS $$
DECLARE
    token_record RECORD;
    user_record RECORD;
BEGIN
    -- Log the function call
    RAISE NOTICE 'verify_email_token called with token: %', SUBSTRING(verification_token, 1, 10) || '...';
    
    -- Find the token
    SELECT * INTO token_record 
    FROM public.email_verification_tokens 
    WHERE token = verification_token 
    AND used_at IS NULL 
    AND expires_at > NOW()
    LIMIT 1;
    
    -- Check if token was found
    IF NOT FOUND THEN
        RAISE NOTICE 'Token not found, expired, or already used';
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired verification token'
        );
    END IF;
    
    -- Mark token as used
    UPDATE public.email_verification_tokens 
    SET used_at = NOW() 
    WHERE token = verification_token;
    
    -- Update user's email verification status in auth.users
    UPDATE auth.users 
    SET email_confirmed_at = NOW()
    WHERE id = token_record.user_id
    AND email_confirmed_at IS NULL;
    
    -- Also update in public.users table if it exists
    UPDATE public.users 
    SET is_verified = true
    WHERE id = token_record.user_id;
    
    RAISE NOTICE 'Token verified successfully for user: %', token_record.user_id;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'email', token_record.email,
        'user_id', token_record.user_id,
        'message', 'Email verified successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in verify_email_token: %', SQLERRM;
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.verify_email_token TO anon, authenticated, service_role;

-- Step 4: Enable RLS on the tokens table
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for the tokens table
DROP POLICY IF EXISTS "Allow service role full access to email_verification_tokens" ON public.email_verification_tokens;
CREATE POLICY "Allow service role full access to email_verification_tokens" 
ON public.email_verification_tokens 
FOR ALL 
TO service_role 
USING (true);

-- Step 6: Test the function
DO $$
DECLARE
    test_result JSON;
BEGIN
    -- Test with a non-existent token (should fail gracefully)
    SELECT verify_email_token('test-nonexistent-token') INTO test_result;
    RAISE NOTICE 'Test result: %', test_result;
END $$;

-- Step 7: Check current tokens (for debugging)
SELECT 
    id,
    email,
    SUBSTRING(token, 1, 10) || '...' as token_preview,
    expires_at,
    created_at,
    used_at,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRED'
        WHEN used_at IS NOT NULL THEN 'USED'
        ELSE 'VALID'
    END as status
FROM public.email_verification_tokens 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 8: Check if function exists
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'verify_email_token';
