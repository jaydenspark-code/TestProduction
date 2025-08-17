-- QUICK FIX FOR USER PRIVACY SETTINGS RLS ISSUE
-- Run this in your Supabase SQL Editor to fix the registration error

-- Drop any existing problematic policies
DROP POLICY IF EXISTS "Service role full access" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can view own privacy" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can update own privacy" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can insert own privacy" ON public.user_privacy_settings;

-- Create a comprehensive service role policy that bypasses all restrictions
CREATE POLICY "Service role bypasses all RLS" 
ON public.user_privacy_settings 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Also allow authenticated users to manage their own privacy settings
CREATE POLICY "Users manage own privacy settings" 
ON public.user_privacy_settings 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id::uuid) 
WITH CHECK (auth.uid() = user_id::uuid);

-- Ensure the table has RLS enabled
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.user_privacy_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_privacy_settings TO authenticated;

-- Test message
DO $$
BEGIN
    RAISE NOTICE '✅ Privacy settings RLS policies fixed!';
    RAISE NOTICE '🔧 Service role can now create privacy settings during registration';
    RAISE NOTICE '👤 Users can manage their own privacy settings';
END $$;
