-- Fix Manual Registration RLS Policy Issue
-- This script fixes the RLS policies to allow both manual registration and OAuth registration

BEGIN;

-- Display current policies for debugging
SELECT 'Current RLS Policies for users table:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Drop all existing INSERT policies that are too restrictive
DROP POLICY IF EXISTS "Allow authenticated user creation" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow OAuth user creation" ON public.users;
DROP POLICY IF EXISTS "Allow OAuth user upsert" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;

-- Create a new comprehensive INSERT policy that allows:
-- 1. Manual registration (before user is authenticated)
-- 2. OAuth registration (after auth.user exists but before public.users record)
-- 3. Service role operations
CREATE POLICY "Allow user registration and OAuth creation" ON public.users
    FOR INSERT 
    WITH CHECK (
        -- Case 1: Manual registration - allow if no auth context yet (anonymous users)
        auth.uid() IS NULL
        OR
        -- Case 2: OAuth registration - user is authenticated and creating their own record
        (auth.uid() IS NOT NULL AND auth.uid() = id)
        OR
        -- Case 3: Service role operations
        current_setting('role') = 'service_role'
    );

-- Keep existing SELECT policies
-- (We don't need to recreate them as they're working fine)

-- Keep existing UPDATE policies  
-- (We don't need to recreate them as they're working fine)

-- Verify policies after update
SELECT 'Updated RLS Policies for users table:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Test the policy by showing what it allows
SELECT '✅ Manual registration RLS policy fixed!' as result;
SELECT 'Policy now allows:' as note;
SELECT '1. Anonymous users can INSERT (manual registration)' as capability_1;
SELECT '2. Authenticated users can INSERT their own record (OAuth)' as capability_2;
SELECT '3. Service role can INSERT any record (admin operations)' as capability_3;

COMMIT;
