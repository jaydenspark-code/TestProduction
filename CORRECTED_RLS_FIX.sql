-- CORRECTED RLS FIX - Handles existing policy
-- Copy and paste this EXACT SQL and run it:

BEGIN;

-- First, let's see what policies currently exist
SELECT 'Current policies before fix:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Drop ALL existing INSERT policies (including the one that already exists)
DROP POLICY IF EXISTS "Allow authenticated user creation" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow OAuth user creation" ON public.users;
DROP POLICY IF EXISTS "Allow OAuth user upsert" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Allow user registration and OAuth creation" ON public.users;

-- Now create the correct policy
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

-- Verify the policy was created correctly
SELECT 'Policies after fix:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

COMMIT;

SELECT '✅ RLS policy fixed and corrected!' as result;
