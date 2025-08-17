-- COMPREHENSIVE OAUTH DEBUGGING TEST
-- Run this after a Google OAuth attempt to see what happened

-- 1. Check if user exists in auth.users (Supabase auth table)
SELECT 
    'AUTH USERS CHECK' as section,
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at,
    CASE 
        WHEN raw_user_meta_data->>'provider' = 'google' THEN '✅ Google OAuth User'
        WHEN raw_user_meta_data IS NOT NULL THEN '🔍 OAuth User: ' || COALESCE(raw_user_meta_data->>'provider', 'unknown')
        ELSE '❌ Not OAuth User'
    END as auth_method
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check if user exists in public.users table
SELECT 
    'PUBLIC USERS CHECK' as section,
    id,
    email,
    full_name,
    created_at,
    'Found in public.users' as status
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- 3. Find users who are in auth but NOT in public
SELECT 
    'MISSING USERS' as section,
    au.id,
    au.email,
    au.created_at as auth_created_at,
    'In auth.users but NOT in public.users' as issue
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- 4. Check current RLS policies on users table
SELECT 
    'CURRENT POLICIES' as section,
    policyname,
    cmd as operation,
    qual::text as using_condition,
    with_check::text as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd, policyname;

-- 5. Test current authentication state
SELECT 
    'CURRENT AUTH STATE' as section,
    COALESCE(auth.uid()::text, 'NO ACTIVE SESSION') as current_user_id,
    COALESCE(auth.role(), 'NO ROLE') as current_role;

-- 6. Test if we can manually insert a user (to verify policies work)
-- This will only work if you're authenticated
INSERT INTO public.users (
    id,
    email,
    full_name,
    created_at,
    updated_at
) 
SELECT 
    auth.uid(),
    'test-' || auth.uid()::text || '@example.com',
    'Test User for Policy Check',
    now(),
    now()
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()
)
RETURNING 'MANUAL INSERT TEST' as section, id, email, 'Successfully inserted' as result;
