-- DETAILED USERS TABLE POLICY ANALYSIS
-- Run this to see the exact conditions in the users table policies

-- 1. Show exact policy conditions for users table
SELECT 
    'USERS POLICY DETAILS' as section,
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'INSERT' THEN 'INSERT Policy'
        WHEN cmd = 'SELECT' THEN 'SELECT Policy' 
        WHEN cmd = 'UPDATE' THEN 'UPDATE Policy'
        WHEN cmd = 'DELETE' THEN 'DELETE Policy'
        WHEN cmd = 'ALL' THEN 'ALL Operations Policy'
        ELSE cmd
    END as policy_type,
    COALESCE(qual::text, 'NO CONDITION') as using_clause_condition,
    COALESCE(with_check::text, 'NO WITH CHECK') as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY 
    CASE cmd 
        WHEN 'ALL' THEN 1
        WHEN 'INSERT' THEN 2
        WHEN 'SELECT' THEN 3
        WHEN 'UPDATE' THEN 4
        WHEN 'DELETE' THEN 5
        ELSE 6
    END,
    policyname;

-- 2. Test what auth.uid() returns in current context
SELECT 
    'CURRENT AUTH STATE' as section,
    'auth.uid()' as function_name,
    COALESCE(auth.uid()::text, 'NULL - No authenticated user') as current_value,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED'
        ELSE 'NOT AUTHENTICATED'
    END as auth_status;

-- 3. Test what auth.role() returns
SELECT 
    'CURRENT ROLE STATE' as section,
    'auth.role()' as function_name,
    COALESCE(auth.role(), 'NULL - No role') as current_value;

-- 4. Show what a successful INSERT would need
SELECT 
    'INSERT REQUIREMENTS' as section,
    'For google_oauth_insert policy' as policy_name,
    'Check if policy allows: auth.uid() = id OR similar condition' as requirement;

-- 5. Test if we can see any existing users (to test SELECT policies)
SELECT 
    'EXISTING USERS TEST' as section,
    COUNT(*) as total_users,
    'If this shows > 0, SELECT policies work' as note
FROM users;
