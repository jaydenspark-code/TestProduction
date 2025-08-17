-- Timezone and token expiration diagnostic

-- Check current time and timezone
SELECT 
    NOW() as current_time,
    CURRENT_TIMESTAMP as current_timestamp,
    timezone('UTC', NOW()) as utc_time;

-- Check the exact tokens and their expiration times
SELECT 
    token,
    expires_at,
    NOW() as current_time,
    expires_at > NOW() as is_not_expired,
    used_at,
    used_at IS NULL as is_not_used,
    (used_at IS NULL AND expires_at > NOW()) as should_match_query
FROM public.email_verification_tokens
WHERE token IN ('becpb1b16a01c3a0bfun5', 'djde92l5pnfav8t4bbko9');

-- Test the exact WHERE clause from the function
SELECT 
    'Direct query test:' as test_type,
    COUNT(*) as matching_tokens
FROM public.email_verification_tokens 
WHERE token = 'becpb1b16a01c3a0bfun5'
AND used_at IS NULL 
AND expires_at > NOW();

-- Also check what happens if we remove the NOW() condition
SELECT 
    'Without time check:' as test_type,
    COUNT(*) as matching_tokens
FROM public.email_verification_tokens 
WHERE token = 'becpb1b16a01c3a0bfun5'
AND used_at IS NULL;
