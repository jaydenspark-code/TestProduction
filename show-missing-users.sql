-- SHOW RECENT MISSING USERS
-- This will show us the specific users that are missing

SELECT 
    'RECENT MISSING USERS' as section,
    au.id,
    au.email,
    au.created_at as auth_created_at,
    au.last_sign_in_at,
    'Missing from public.users table' as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 5;
