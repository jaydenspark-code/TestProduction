-- SAFE FIX FOR FOREIGN KEY CONSTRAINT ISSUE
-- Instead of updating ID, we'll delete the duplicate and handle the conflict properly

-- Step 1: Check the current situation
SELECT 
    'CURRENT SITUATION' as section,
    'Check both auth and public users' as description;

-- Auth user
SELECT 
    'AUTH USER' as source,
    id as user_id,
    email,
    created_at
FROM auth.users 
WHERE email = 'markjunior339@gmail.com';

-- Public user  
SELECT 
    'PUBLIC USER' as source,
    id as user_id,
    email,
    created_at
FROM public.users 
WHERE email = 'markjunior339@gmail.com';

-- Step 2: Check what's referencing this user
SELECT 
    'FOREIGN KEY REFERENCES' as section,
    'user_privacy_settings' as table_name,
    COUNT(*) as reference_count
FROM user_privacy_settings 
WHERE user_id = 'acb35b7c-5445-450b-ba35-48dcea1772de';

-- Step 3: Safe approach - Delete the conflicting public user and let OAuth recreate it
-- First delete dependent records
DELETE FROM user_privacy_settings 
WHERE user_id = 'acb35b7c-5445-450b-ba35-48dcea1772de';

-- Then delete the user record
DELETE FROM public.users 
WHERE email = 'markjunior339@gmail.com'
RETURNING 'DELETED USER' as status, id, email, 'Ready for OAuth recreation' as action;

-- Step 4: Verify cleanup
SELECT 
    'VERIFICATION' as section,
    COUNT(*) as remaining_public_users,
    'Should be 0 for markjunior339@gmail.com' as note
FROM public.users 
WHERE email = 'markjunior339@gmail.com';
