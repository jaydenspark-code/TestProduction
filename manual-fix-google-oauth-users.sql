-- MANUAL USER CREATION FOR FAILED GOOGLE OAUTH USERS
-- Run this to manually fix the missing Google OAuth users

-- Step 1: See the latest missing user
SELECT 
    'LATEST MISSING USER' as section,
    au.id,
    au.email,
    au.created_at,
    'Will be manually created' as action
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 1;

-- Step 2: Insert the latest missing Google OAuth user manually
-- (Replace the values below with the actual user data from Step 1)
INSERT INTO public.users (
    id,
    email,
    full_name,
    is_verified,
    is_paid,
    country,
    currency,
    role,
    referral_code,
    created_at,
    updated_at
) 
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Google User') as full_name,
    true as is_verified,
    false as is_paid,
    'US' as country,
    'USD' as currency,
    'user' as role,
    'REF' || UPPER(SUBSTRING(au.id::text, 1, 8)) as referral_code,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 1
RETURNING 'MANUAL USER CREATION' as section, id, email, full_name, 'Successfully created' as status;
