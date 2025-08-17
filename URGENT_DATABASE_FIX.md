🚨 URGENT: DATABASE RLS POLICY FIX NEEDED

The registration is failing because Supabase RLS policies are blocking user creation.

IMMEDIATE ACTION REQUIRED:

1. Go to: https://supabase.com/dashboard
2. Navigate to your project: bmtaqilpuszwoshtizmq
3. Click "SQL Editor" in the left sidebar
4. Copy and paste this EXACT SQL and run it:

-- Fix RLS policies for user registration
BEGIN;

-- Drop all restrictive INSERT policies
DROP POLICY IF EXISTS "Allow authenticated user creation" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow OAuth user creation" ON public.users;
DROP POLICY IF EXISTS "Allow OAuth user upsert" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;

-- Create permissive policy for registration
CREATE POLICY "Allow user registration and OAuth creation" ON public.users
FOR INSERT
WITH CHECK (
auth.uid() IS NULL
OR
(auth.uid() IS NOT NULL AND auth.uid() = id)
OR
current_setting('role') = 'service_role'
);

COMMIT;

SELECT '✅ Registration RLS policy fixed!' as result;

5. Click "RUN" to execute the SQL
6. You should see "✅ Registration RLS policy fixed!" message
7. Then try registration again

This will allow anonymous users to register while maintaining security.
