-- Simple Fix for Google OAuth User Creation
-- This addresses the "User not allowed" error during Google OAuth callback

BEGIN;

-- Remove conflicting policies that might be too restrictive
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public read access for referral validation" ON public.users;

-- Create simple, working policies for OAuth users
-- 1. Allow authenticated users to create their own profile
CREATE POLICY "authenticated_users_can_insert_own_profile" ON public.users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 2. Allow users to view their own profile
CREATE POLICY "users_can_view_own_profile" ON public.users
    FOR SELECT 
    USING (auth.uid() = id OR true);  -- Allow public read for referrals

-- 3. Allow users to update their own profile  
CREATE POLICY "users_can_update_own_profile" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Service role bypass (for admin operations)
CREATE POLICY "service_role_all_access" ON public.users
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Test the fix
SELECT '✅ Simple Google OAuth RLS fix applied!' as result;
SELECT 'Policies created:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';

COMMIT;
