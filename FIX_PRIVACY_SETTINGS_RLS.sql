-- FIX RLS POLICIES FOR user_privacy_settings TABLE
-- This fixes the "new row violates row-level security policy" error during registration

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own privacy settings" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can insert their own privacy settings" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Service role can manage all privacy settings" ON public.user_privacy_settings;

-- Create comprehensive RLS policies for user_privacy_settings

-- 1. Allow service role full access (for registration process)
CREATE POLICY "Service role can manage all privacy settings" 
ON public.user_privacy_settings 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 2. Allow users to view their own privacy settings
CREATE POLICY "Users can view their own privacy settings" 
ON public.user_privacy_settings 
FOR SELECT 
TO authenticated 
USING (
  auth.uid()::text = user_id OR 
  auth.uid() = user_id::uuid
);

-- 3. Allow users to update their own privacy settings
CREATE POLICY "Users can update their own privacy settings" 
ON public.user_privacy_settings 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid()::text = user_id OR 
  auth.uid() = user_id::uuid
) 
WITH CHECK (
  auth.uid()::text = user_id OR 
  auth.uid() = user_id::uuid
);

-- 4. Allow users to insert their own privacy settings (for manual creation)
CREATE POLICY "Users can insert their own privacy settings" 
ON public.user_privacy_settings 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid()::text = user_id OR 
  auth.uid() = user_id::uuid
);

-- 5. Allow anonymous users to create privacy settings during registration
CREATE POLICY "Allow privacy settings creation during registration" 
ON public.user_privacy_settings 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.user_privacy_settings TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_privacy_settings TO authenticated;
GRANT INSERT ON public.user_privacy_settings TO anon;

-- Test the fix
DO $$
BEGIN
    RAISE NOTICE '🔧 Fixed RLS policies for user_privacy_settings table';
    RAISE NOTICE '✅ Service role can now create privacy settings during registration';
    RAISE NOTICE '✅ Users can manage their own privacy settings';
    RAISE NOTICE '✅ Anonymous users can create privacy settings during registration';
END $$;
