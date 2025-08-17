-- Fix email verification by updating Supabase configuration
-- This ensures proper email confirmation flow

-- First, let's check current auth users and their confirmation status
SELECT 
  id,
  email,
  email_confirmed_at,
  phone_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Check if users exist in public.users table
SELECT 
  u.id,
  u.email,
  u.is_verified,
  u.is_paid,
  au.email_confirmed_at IS NOT NULL as auth_confirmed
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 10;

-- Update verification trigger to sync with auth confirmation
CREATE OR REPLACE FUNCTION public.sync_user_verification()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- When auth.users email_confirmed_at is updated, sync it to public.users
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users 
    SET 
      is_verified = true,
      updated_at = NOW()
    WHERE id = NEW.id;
    
    RAISE LOG 'User % email verified, syncing to public.users', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for email confirmation sync
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.sync_user_verification();
