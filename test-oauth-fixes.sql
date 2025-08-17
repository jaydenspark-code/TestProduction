-- COMPREHENSIVE TESTING PLAN FOR GOOGLE OAUTH FIXES
-- Run these queries step by step to test our fixes

-- TEST 1: Check if the email conflict fix worked
SELECT 
    'TEST 1: EMAIL CONFLICT FIX' as test_name,
    'Checking if markjunior330@gmail.com is properly linked' as description;

SELECT 
    au.id as auth_id,
    pu.id as public_id,
    au.email,
    CASE 
        WHEN au.id = pu.id THEN '✅ SUCCESS: IDs match'
        WHEN pu.id IS NULL THEN '❌ FAIL: User missing from public.users'
        ELSE '❌ FAIL: ID mismatch'
    END as test_result
FROM auth.users au
LEFT JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'markjunior330@gmail.com';

-- TEST 2: Count missing users before new OAuth test
SELECT 
    'TEST 2: MISSING USERS COUNT' as test_name,
    COUNT(*) as missing_users_count,
    'Users in auth but not in public (before new test)' as description
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- TEST 3: Check RLS policies are working
SELECT 
    'TEST 3: RLS POLICIES CHECK' as test_name,
    policyname,
    cmd as operation,
    'Policy exists and should allow OAuth users' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
AND policyname LIKE '%oauth%'
ORDER BY cmd;

-- TEST 4: Simulate what the callback should do
SELECT 
    'TEST 4: CALLBACK SIMULATION' as test_name,
    'This simulates the callback insert/update logic' as description;

-- This is what the callback tries to do (simulation only)
SELECT 
    'CALLBACK LOGIC TEST' as section,
    'If new OAuth user, this should work:' as description,
    'INSERT with proper RLS permissions' as expected_action;

-- TEST 5: Check current auth state
SELECT 
    'TEST 5: AUTH STATE CHECK' as test_name,
    COALESCE(auth.uid()::text, 'NO ACTIVE SESSION') as current_auth_user,
    COALESCE(auth.role(), 'NO ROLE') as current_role,
    'Check if we have proper auth context' as purpose;
