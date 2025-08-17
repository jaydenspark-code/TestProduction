-- Fix user creation trigger for automatic profile creation
-- This trigger ensures that when a user registers in auth.users, 
-- a corresponding profile is created in the public.users table

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_metadata JSONB;
    user_country TEXT := 'US';
    user_currency TEXT := 'USD';
    user_full_name TEXT := 'Unknown User';
    user_referral_code TEXT;
    referred_by_code TEXT;
    referrer_user_id UUID;
BEGIN
    -- Extract metadata from new user
    user_metadata := NEW.raw_user_meta_data;
    
    -- Extract user information from metadata
    IF user_metadata IS NOT NULL THEN
        user_full_name := COALESCE(
            user_metadata->>'full_name',
            user_metadata->>'fullName', 
            user_metadata->>'name',
            'Unknown User'
        );
        user_country := COALESCE(user_metadata->>'country', 'US');
        user_currency := COALESCE(user_metadata->>'currency', 'USD');
        referred_by_code := user_metadata->>'referred_by';
        user_referral_code := COALESCE(
            user_metadata->>'referral_code',
            'USR' || upper(substr(replace(NEW.id::text, '-', ''), 1, 10))
        );
    ELSE
        -- Generate referral code from user ID if no metadata
        user_referral_code := 'USR' || upper(substr(replace(NEW.id::text, '-', ''), 1, 10));
    END IF;
    
    -- Find referrer if referred_by code exists
    IF referred_by_code IS NOT NULL THEN
        SELECT id INTO referrer_user_id
        FROM users
        WHERE referral_code = referred_by_code;
    END IF;
    
    -- Insert new user into public.users table
    INSERT INTO public.users (
        id,
        email,
        full_name,
        country,
        currency,
        referral_code,
        referred_by,
        is_verified,
        is_paid,
        role,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        user_full_name,
        user_country,
        user_currency,
        user_referral_code,
        referrer_user_id,
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        false,
        'user',
        NEW.created_at,
        NEW.created_at
    );
    
    -- Create referral record if user was referred
    IF referrer_user_id IS NOT NULL THEN
        INSERT INTO referrals (
            referrer_id,
            referred_user_id,
            referral_code,
            status,
            created_at
        ) VALUES (
            referrer_user_id,
            NEW.id,
            referred_by_code,
            'pending',
            NOW()
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE LOG 'Error creating user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profiles
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated, anon;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL USING (true);

-- Test the function (optional - for verification)
-- SELECT public.handle_new_user() returns trigger;
