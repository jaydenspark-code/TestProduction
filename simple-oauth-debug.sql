-- SIMPLE OAUTH DEBUGGING - NO ERRORS
-- Run this to check the basic OAuth situation

-- 1. Check recent auth.users
SELECT 
    'RECENT AUTH USERS' as section,
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check recent public.users
SELECT 
    'RECENT PUBLIC USERS' as section,
    id,
    email,
    full_name,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- 3. Find missing users (in auth but not in public)
SELECT 
    'MISSING FROM PUBLIC' as section,
    au.id,
    au.email,
    au.created_at as auth_created,
    'User exists in auth but missing from public.users' as issue
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- 4. Current session info
SELECT 
    'CURRENT SESSION' as section,
    COALESCE(auth.uid()::text, 'NO SESSION') as current_user_id,
    COALESCE(auth.role(), 'NO ROLE') as current_role;

-- 5. Count totals
SELECT 
    'TOTALS' as section,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.users) as total_public_users,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.users pu ON au.id = pu.id WHERE pu.id IS NULL) as missing_from_public;
