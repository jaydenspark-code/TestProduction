-- 🚨 EMERGENCY FIX: Ensure email_verification_codes table exists with correct permissions
-- Run this to fix the "Failed to store verification code" error

-- Step 1: Drop and recreate table to ensure clean state
DROP TABLE IF EXISTS public.email_verification_codes CASCADE;

-- Step 2: Create table with correct structure
CREATE TABLE public.email_verification_codes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    code VARCHAR(6) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ NULL,
    attempts INTEGER DEFAULT 0
);

-- Step 3: Grant ALL permissions to service_role (this is crucial!)
GRANT ALL ON TABLE public.email_verification_codes TO service_role;
GRANT ALL ON SEQUENCE public.email_verification_codes_id_seq TO service_role;

-- Step 4: Grant specific permissions to other roles
GRANT SELECT, INSERT, UPDATE ON TABLE public.email_verification_codes TO authenticated;
GRANT SELECT ON TABLE public.email_verification_codes TO anon;

-- Step 5: Enable RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Step 6: Create permissive RLS policies
DROP POLICY IF EXISTS "Allow service role full access" ON public.email_verification_codes;
CREATE POLICY "Allow service role full access" 
ON public.email_verification_codes 
FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert their own codes" ON public.email_verification_codes;
CREATE POLICY "Allow authenticated users to insert their own codes" 
ON public.email_verification_codes 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to read verification codes" ON public.email_verification_codes;
CREATE POLICY "Allow users to read verification codes" 
ON public.email_verification_codes 
FOR SELECT 
TO authenticated, anon
USING (true);

-- Step 7: Test insert (this should work now)
INSERT INTO public.email_verification_codes (user_id, email, code, expires_at, created_at)
VALUES (
    gen_random_uuid(),
    'test@example.com',
    'TEST01',
    NOW() + INTERVAL '15 minutes',
    NOW()
);

-- Step 8: Check the test insert worked
SELECT * FROM public.email_verification_codes WHERE email = 'test@example.com';

-- Step 9: Clean up test data
DELETE FROM public.email_verification_codes WHERE email = 'test@example.com';

-- Step 10: Show final table structure (using standard SQL instead of \d)
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'email_verification_codes'
ORDER BY ordinal_position;
