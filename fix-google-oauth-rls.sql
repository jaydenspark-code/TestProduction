-- Fix Google OAuth User Creation Issue
-- This script addresses the RLS policy issue preventing Google OAuth users 
-- from being created in the public.users table

BEGIN;

-- First, let's check current RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Drop existing INSERT policy and recreate with better logic
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Allow OAuth user creation" ON public.users;

-- Create a comprehensive INSERT policy that handles both regular registration and OAuth
CREATE POLICY "Allow authenticated user creation" ON public.users
    FOR INSERT 
    WITH CHECK (
        -- Allow if the user is authenticated and the ID matches their auth ID
        auth.uid() = id 
        OR 
        -- OR allow if this is during OAuth flow (user exists in auth.users but not in public.users)
        (
            auth.uid() IS NOT NULL 
            AND auth.uid()::text = id::text
            AND EXISTS (
                SELECT 1 FROM auth.users au 
                WHERE au.id = auth.uid()
            )
        )
    );

-- Also ensure the service role can always insert (for admin operations)
CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT 
    WITH CHECK (
        current_setting('role') = 'service_role'
        OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Create a policy to allow upserts during OAuth callback
CREATE POLICY "Allow OAuth user upsert" ON public.users
    FOR ALL 
    USING (
        -- Allow if user is authenticated and accessing their own record
        auth.uid() = id
        OR
        -- Allow service role access
        current_setting('role') = 'service_role'
    )
    WITH CHECK (
        -- Allow if user is authenticated and creating/updating their own record
        auth.uid() = id
        OR
        -- Allow service role access
        current_setting('role') = 'service_role'
    );

-- Verify the policies were created
SELECT 'RLS Policies for users table:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Test message
SELECT '✅ Google OAuth RLS policies updated successfully!' as result;

COMMIT;
