-- FIND ACTUAL GOOGLE OAUTH USERS
-- Let's see what email addresses actually exist

-- 1. Show recent auth.users (last 5)
SELECT 
    'RECENT AUTH USERS' as section,
    id,
    email,
    created_at,
    'Auth user' as source
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Show recent public.users (last 5)  
SELECT 
    'RECENT PUBLIC USERS' as section,
    id,
    email,
    created_at,
    'Public user' as source
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Find emails that exist in auth but not public
SELECT 
    'MISSING FROM PUBLIC' as section,
    au.email,
    au.id as auth_id,
    au.created_at,
    'Exists in auth, missing from public' as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 5;

-- 4. Find emails with similar patterns (in case of typo)
SELECT 
    'SIMILAR EMAILS IN AUTH' as section,
    email,
    id,
    created_at
FROM auth.users 
WHERE email LIKE '%markjunior%' OR email LIKE '%330%'
ORDER BY created_at DESC;

SELECT 
    'SIMILAR EMAILS IN PUBLIC' as section,
    email,
    id,
    created_at
FROM public.users 
WHERE email LIKE '%markjunior%' OR email LIKE '%330%'
ORDER BY created_at DESC;
