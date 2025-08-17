-- Quick verification queries to check if the authentication fix is working

-- 1. Check if new columns exist in users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('temp_password', 'auth_user_id')
ORDER BY column_name;

-- 2. Check if the verify_email_code function exists and is updated
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_name = 'verify_email_code'
AND routine_schema = 'public';

-- 3. Check existing users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Test query to see if any users have been through the new flow
SELECT 
    id,
    email,
    full_name,
    is_verified,
    CASE 
        WHEN temp_password IS NOT NULL THEN 'Has temp password'
        ELSE 'No temp password'
    END as temp_password_status,
    CASE 
        WHEN auth_user_id IS NOT NULL THEN 'Linked to auth'
        ELSE 'Not linked to auth'
    END as auth_link_status,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;
