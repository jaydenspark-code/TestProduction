-- COMPREHENSIVE DATABASE ANALYSIS SCRIPT
-- This script shows all tables and their RLS policies to diagnose Google OAuth issues

-- ============= PART 1: LIST ALL TABLES IN PUBLIC SCHEMA =============
SELECT '=== ALL TABLES IN PUBLIC SCHEMA ===' as info;

SELECT 
    t.table_name,
    t.table_type,
    CASE 
        WHEN c.relrowsecurity = true THEN 'ENABLED'
        ELSE 'DISABLED'
    END as rls_status
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name;

-- ============= PART 2: SHOW ALL RLS POLICIES =============
SELECT '=== ALL RLS POLICIES IN PUBLIC SCHEMA ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============= PART 3: FOCUS ON USERS TABLE =============
SELECT '=== USERS TABLE DETAILED ANALYSIS ===' as info;

-- Check if users table exists and its RLS status
SELECT 
    'users' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'users'
        ) THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as table_exists,
    CASE 
        WHEN c.relrowsecurity = true THEN 'ENABLED'
        ELSE 'DISABLED'
    END as rls_status
FROM pg_class c 
WHERE c.relname = 'users' AND c.relnamespace = (
    SELECT oid FROM pg_namespace WHERE nspname = 'public'
);

-- Show users table structure
SELECT '=== USERS TABLE COLUMNS ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Show users table policies in detail
SELECT '=== USERS TABLE POLICIES ===' as info;

SELECT 
    policyname,
    cmd as operation,
    permissive,
    roles,
    qual as using_condition,
    with_check as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- ============= PART 4: CHECK AUTHENTICATION FUNCTIONS =============
SELECT '=== AUTHENTICATION FUNCTION CHECK ===' as info;

-- Test if auth.uid() function works
SELECT 
    'Testing auth.uid() function:' as test_name,
    CASE 
        WHEN auth.uid() IS NULL THEN 'NO ACTIVE SESSION'
        ELSE 'SESSION EXISTS: ' || auth.uid()::text
    END as result;

-- Test if auth.role() function works
SELECT 
    'Testing auth.role() function:' as test_name,
    COALESCE(auth.role(), 'NO ROLE OR NULL') as result;

-- ============= PART 5: SIMULATION TEST =============
SELECT '=== POLICY SIMULATION TEST ===' as info;

-- This shows what would happen if we tried to insert a user
-- (This is just a simulation, not an actual insert)
SELECT 
    'Google OAuth Insert Policy Test' as test_name,
    'Would check: auth.uid() = id' as condition,
    'Current auth.uid(): ' || COALESCE(auth.uid()::text, 'NULL') as current_session;

-- ============= PART 6: RECOMMEND ACTIONS =============
SELECT '=== RECOMMENDATIONS ===' as info;

SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'users'
        ) THEN 'ERROR: users table does not exist!'
        
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_class c 
            WHERE c.relname = 'users' 
            AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND c.relrowsecurity = true
        ) THEN 'WARNING: RLS is not enabled on users table'
        
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = 'users' AND cmd = 'INSERT'
        ) THEN 'ERROR: No INSERT policy exists for users table'
        
        ELSE 'INFO: Basic setup looks correct'
    END as diagnosis;

-- ============= PART 7: SIMPLE TEST QUERY =============
SELECT '=== SIMPLE ACCESS TEST ===' as info;

-- Try to count users (this should work with SELECT policy)
SELECT 
    'User count test' as test_name,
    (
        SELECT COUNT(*) 
        FROM public.users 
        WHERE true
    ) as user_count,
    'If this shows a number, SELECT policy works' as note;

-- Show the current timestamp for reference
SELECT 
    'Current timestamp' as info,
    NOW() as current_time;
