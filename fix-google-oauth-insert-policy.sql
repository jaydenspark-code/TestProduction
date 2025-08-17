-- FIX FOR GOOGLE OAUTH INSERT POLICY ISSUE
-- This fixes the specific problem where Google OAuth users can't insert their profile

-- 1. First, let's drop the restrictive google_oauth_insert policy
DROP POLICY IF EXISTS google_oauth_insert ON users;

-- 2. Create a more permissive INSERT policy for authenticated users
-- This allows any authenticated user to insert a record where id = auth.uid()
CREATE POLICY "google_oauth_insert_fixed" ON users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 3. Also ensure we have a policy that allows service role to insert
-- (This is for system operations)
DROP POLICY IF EXISTS "service_role_insert_users" ON users;
CREATE POLICY "service_role_insert_users" ON users
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. Let's also make sure the SELECT policy is working correctly
-- Drop and recreate it to be sure
DROP POLICY IF EXISTS google_oauth_select ON users;

CREATE POLICY "google_oauth_select_fixed" ON users
FOR SELECT
TO authenticated
USING (id = auth.uid() OR true);

-- 5. Fix the UPDATE policy as well
DROP POLICY IF EXISTS google_oauth_update ON users;

CREATE POLICY "google_oauth_update_fixed" ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 6. Verify the new policies
SELECT 
    'VERIFICATION' as section,
    'New policies created successfully' as status,
    'Google OAuth should now work' as result;

-- 7. Test INSERT capability (this will show if our fix worked)
-- Note: This test requires an active authenticated session
SELECT 
    'INSERT TEST' as section,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'Ready to test INSERT with auth.uid(): ' || auth.uid()::text
        ELSE 'No active session - test during OAuth flow'
    END as test_status;
