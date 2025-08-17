-- FIX FOR DUPLICATE EMAIL CONSTRAINT ISSUE
-- This handles the case where Google OAuth user has same email but different ID

-- Step 1: See the conflict
SELECT 
    'EMAIL CONFLICT ANALYSIS' as section,
    'Auth user vs Public user with same email' as description;

-- Check auth.users for this email
SELECT 
    'AUTH USER' as source,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'markjunior339@gmail.com';

-- Check public.users for this email  
SELECT 
    'PUBLIC USER' as source,
    id,
    email,
    created_at
FROM public.users 
WHERE email = 'markjunior339@gmail.com';

-- Step 2: Fix by updating the public.users ID to match auth.users ID
UPDATE public.users 
SET id = (
    SELECT id FROM auth.users WHERE email = 'markjunior339@gmail.com' LIMIT 1
)
WHERE email = 'markjunior339@gmail.com'
RETURNING 'FIXED USER' as status, id, email, 'ID updated to match auth.users' as action;

-- Step 3: Verify the fix worked
SELECT 
    'VERIFICATION' as section,
    au.id as auth_id,
    pu.id as public_id,
    au.email,
    CASE 
        WHEN au.id = pu.id THEN '✅ IDs MATCH - FIXED!'
        ELSE '❌ IDs still different'
    END as result
FROM auth.users au
JOIN public.users pu ON au.email = pu.email
WHERE au.email = 'markjunior339@gmail.com';
