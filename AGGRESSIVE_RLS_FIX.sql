-- AGGRESSIVE FIX FOR USER PRIVACY SETTINGS RLS
-- This completely resets all RLS policies and creates fresh ones

-- STEP 1: Drop ALL existing policies completely
DROP POLICY IF EXISTS "Service role bypasses all RLS" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users manage own privacy settings" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Service role full access" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can view own privacy" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can update own privacy" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can insert own privacy" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Allow anon insert" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Allow service role all" ON public.user_privacy_settings;

-- STEP 2: Temporarily disable RLS to clean up
ALTER TABLE public.user_privacy_settings DISABLE ROW LEVEL SECURITY;

-- STEP 3: Grant ALL permissions to service_role
GRANT ALL PRIVILEGES ON public.user_privacy_settings TO service_role;
GRANT ALL PRIVILEGES ON public.user_privacy_settings TO anon;
GRANT ALL PRIVILEGES ON public.user_privacy_settings TO authenticated;

-- STEP 4: Re-enable RLS
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create the most permissive service role policy
CREATE POLICY "service_role_bypass_all" 
ON public.user_privacy_settings 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- STEP 6: Create user policy for authenticated users
CREATE POLICY "users_own_privacy" 
ON public.user_privacy_settings 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id::uuid) 
WITH CHECK (auth.uid() = user_id::uuid);

-- STEP 7: Allow anonymous inserts (for registration)
CREATE POLICY "allow_anon_insert" 
ON public.user_privacy_settings 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- STEP 8: Test message
DO $$
BEGIN
    RAISE NOTICE '🔧 AGGRESSIVE RLS FIX APPLIED';
    RAISE NOTICE '✅ All policies dropped and recreated';
    RAISE NOTICE '✅ Service role has full access';
    RAISE NOTICE '✅ Anonymous can insert during registration';
    RAISE NOTICE '✅ Users can manage their own settings';
END $$;
