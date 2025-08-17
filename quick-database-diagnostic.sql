-- QUICK DATABASE DIAGNOSTIC FOR GOOGLE OAUTH ISSUES
-- Run this in Supabase SQL Editor to see all tables and policies

-- 1. Show all tables and their RLS status
SELECT 
    'TABLE OVERVIEW' as section,
    t.table_name,
    CASE 
        WHEN c.relrowsecurity = true THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name;

-- 2. Show all RLS policies
SELECT 
    'POLICY OVERVIEW' as section,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'HAS USING CLAUSE'
        ELSE 'NO USING CLAUSE'
    END as using_condition,
    CASE 
        WHEN with_check IS NOT NULL THEN 'HAS WITH CHECK'
        ELSE 'NO WITH CHECK'
    END as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- 3. Focus on users table specifically
SELECT 
    'USERS TABLE FOCUS' as section,
    policyname,
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd, policyname;

-- 4. Test current authentication context
SELECT 
    'AUTH CONTEXT TEST' as section,
    'Current auth.uid()' as test_type,
    COALESCE(auth.uid()::text, 'NULL - No active session') as value
UNION ALL
SELECT 
    'AUTH CONTEXT TEST' as section,
    'Current auth.role()' as test_type,
    COALESCE(auth.role(), 'NULL - No role set') as value;
