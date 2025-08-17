-- Debug script to understand verification token issues

-- Step 1: Check what tokens exist in the database
SELECT 
    'Current Tokens in Database:' as debug_info;

SELECT 
    id,
    email,
    token,
    expires_at,
    created_at,
    used_at,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRED'
        WHEN used_at IS NOT NULL THEN 'USED'
        ELSE 'VALID'
    END as status,
    (expires_at > NOW()) as is_not_expired,
    (used_at IS NULL) as is_not_used
FROM public.email_verification_tokens 
ORDER BY created_at DESC;

-- Step 2: Test the exact token that showed as valid
SELECT 
    'Testing token: becpb1b16a01c3a0bfun5' as debug_info;

-- First, let's manually check if this token exists with the exact same logic as the function
SELECT 
    'Manual token lookup:' as check_type,
    token,
    used_at IS NULL as not_used,
    expires_at > NOW() as not_expired,
    (used_at IS NULL AND expires_at > NOW()) as should_be_valid
FROM public.email_verification_tokens 
WHERE token = 'becpb1b16a01c3a0bfun5';

-- Step 3: Now test the function
SELECT verify_email_token('becpb1b16a01c3a0bfun5') as function_result;

-- Step 4: Test the second token too
SELECT 
    'Testing token: djde92l5pnfav8t4bbko9' as debug_info;

SELECT 
    'Manual token lookup:' as check_type,
    token,
    used_at IS NULL as not_used,
    expires_at > NOW() as not_expired,
    (used_at IS NULL AND expires_at > NOW()) as should_be_valid
FROM public.email_verification_tokens 
WHERE token = 'djde92l5pnfav8t4bbko9';

SELECT verify_email_token('djde92l5pnfav8t4bbko9') as function_result;
