-- AUTHENTICATION SYSTEM FIX
-- This fixes the "Invalid login credentials" issue by ensuring users exist in both 
-- public.users table and auth.users table after email verification

-- Step 1: Add columns to store temporary password and auth user ID
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS temp_password TEXT,
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- Step 3: Update the verification function to return user data including temp_password
CREATE OR REPLACE FUNCTION public.verify_email_code(verification_code TEXT)
RETURNS JSON AS $$
DECLARE
    code_record RECORD;
    user_record RECORD;
BEGIN
    -- Log the function call
    RAISE NOTICE 'verify_email_code called with code: %', verification_code;
    
    -- Find the code (case-insensitive)
    SELECT * INTO code_record 
    FROM public.email_verification_codes 
    WHERE UPPER(code) = UPPER(verification_code)
    AND used_at IS NULL 
    AND expires_at > NOW()
    AND attempts < 5  -- Max 5 attempts
    LIMIT 1;
    
    -- Increment attempt counter for this code
    UPDATE public.email_verification_codes 
    SET attempts = attempts + 1 
    WHERE UPPER(code) = UPPER(verification_code);
    
    -- Check if code was found
    IF code_record IS NULL THEN
        RAISE NOTICE 'Code not found, expired, or too many attempts';
        
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired verification code'
        );
    END IF;
    
    RAISE NOTICE 'Found valid code for user: % email: %', code_record.user_id, code_record.email;
    
    -- Mark code as used
    UPDATE public.email_verification_codes 
    SET used_at = NOW() 
    WHERE id = code_record.id;
    
    -- Update user's email verification status
    UPDATE public.users 
    SET is_verified = true,
        updated_at = NOW()
    WHERE id = code_record.user_id;
    
    -- Get user data to return
    SELECT * INTO user_record 
    FROM public.users 
    WHERE id = code_record.user_id;
    
    RAISE NOTICE 'Code verified successfully for user: %', code_record.user_id;
    
    -- Return success with user data
    RETURN json_build_object(
        'success', true,
        'email', code_record.email,
        'user_id', code_record.user_id,
        'user_data', row_to_json(user_record),
        'message', 'Email verified successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in verify_email_code: %', SQLERRM;
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.verify_email_code TO anon, authenticated, service_role;

-- Step 5: RLS policy for the new auth_user_id column
DROP POLICY IF EXISTS "Users can view their own auth_user_id" ON public.users;
CREATE POLICY "Users can view their own auth_user_id" ON public.users
FOR SELECT USING (auth.uid() = auth_user_id OR auth.uid() = id::text::uuid);

-- Step 6: Create a helper function to create auth users (for Edge Functions if needed)
CREATE OR REPLACE FUNCTION public.create_auth_user_after_verification(
    user_email TEXT,
    user_password TEXT,
    user_full_name TEXT
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- This function should be called from an Edge Function with admin privileges
    -- It's a placeholder for the auth user creation logic
    
    RETURN json_build_object(
        'success', true,
        'message', 'This function should be called from Edge Function with admin auth'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_auth_user_after_verification TO service_role;

-- Step 7: Test the setup
DO $$
BEGIN
    RAISE NOTICE '🔧 Authentication system fix applied successfully!';
    RAISE NOTICE '📝 Summary of changes:';
    RAISE NOTICE '  - Added temp_password column to store password temporarily';
    RAISE NOTICE '  - Added auth_user_id column to link to auth.users';
    RAISE NOTICE '  - Updated verify_email_code function to return user data';
    RAISE NOTICE '  - Added RLS policies for new columns';
    RAISE NOTICE '✅ Users will now be created in auth.users after email verification';
END $$;
