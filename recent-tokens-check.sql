-- Check for any recent tokens that might have been created after the ones we saw
SELECT 
    'All tokens in database (ordered by creation time):' as info;

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
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as age_minutes
FROM public.email_verification_tokens 
ORDER BY created_at DESC;

-- Count total tokens
SELECT 
    'Total tokens in database:' as info,
    COUNT(*) as total_count
FROM public.email_verification_tokens;
