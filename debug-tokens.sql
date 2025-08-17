-- Debug script to check verification tokens
-- Run this in Supabase SQL Editor to see what tokens exist

-- Check if the tokens table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'email_verification_tokens'
) as table_exists;

-- Check all tokens in the table
SELECT 
    id,
    email,
    SUBSTRING(token, 1, 15) || '...' as token_preview,
    expires_at,
    created_at,
    used_at,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRED'
        WHEN used_at IS NOT NULL THEN 'USED'
        ELSE 'VALID'
    END as status,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as age_hours
FROM public.email_verification_tokens 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if the verify function exists
SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public'
    AND routine_name = 'verify_email_token'
) as function_exists;

-- Test the function with a fake token
SELECT verify_email_token('test-token') as test_result;
