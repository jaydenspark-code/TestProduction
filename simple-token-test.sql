-- Simple token test script
-- This will help us understand exactly what's happening

-- First, let's see the raw token data
SELECT 
    'Raw token data:' as info,
    token,
    expires_at,
    used_at,
    created_at,
    NOW() as current_time,
    extract(epoch from (expires_at - NOW())) / 3600 as hours_until_expiry
FROM public.email_verification_tokens 
WHERE token = 'becpb1b16a01c3a0bfun5';

-- Now let's test the exact query conditions from the function
SELECT 
    'Function query test:' as info,
    COUNT(*) as matches
FROM public.email_verification_tokens 
WHERE token = 'becpb1b16a01c3a0bfun5'
AND used_at IS NULL 
AND expires_at > NOW();

-- Test just the token match
SELECT 
    'Token exists:' as info,
    COUNT(*) as matches
FROM public.email_verification_tokens 
WHERE token = 'becpb1b16a01c3a0bfun5';

-- Test just the used_at condition
SELECT 
    'Not used:' as info,
    COUNT(*) as matches
FROM public.email_verification_tokens 
WHERE token = 'becpb1b16a01c3a0bfun5'
AND used_at IS NULL;

-- Test just the expiry condition
SELECT 
    'Not expired:' as info,
    COUNT(*) as matches
FROM public.email_verification_tokens 
WHERE token = 'becpb1b16a01c3a0bfun5'
AND expires_at > NOW();
