-- Database Migration: Fix Row Level Security Policies
-- This script adds proper INSERT policies for the users table to allow user registration

-- First, let's ensure RLS is enabled on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create INSERT policy - Allow authenticated users to insert their own row
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create SELECT policy - Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Create UPDATE policy - Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Optional: Allow public read access for certain fields (if needed for referrals)
-- Uncomment the following if you need public profiles for referral system
-- CREATE POLICY "Public profiles are viewable by everyone" ON public.users
--     FOR SELECT
--     TO public
--     USING (true);

-- Ensure the referrals table also has proper RLS policies
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing referrals policies if they exist
DROP POLICY IF EXISTS "Users can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;

-- Create referrals policies
CREATE POLICY "Users can insert referrals" ON public.referrals
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can view their referrals" ON public.referrals
    FOR SELECT
    TO authenticated
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Ensure the campaigns table has proper RLS policies
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing campaigns policies if they exist
DROP POLICY IF EXISTS "Users can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;

-- Create campaigns policies
CREATE POLICY "Users can view campaigns" ON public.campaigns
    FOR SELECT
    TO authenticated
    USING (true); -- All authenticated users can view campaigns

CREATE POLICY "Users can insert campaigns" ON public.campaigns
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own campaigns" ON public.campaigns
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- Ensure the transactions table has proper RLS policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing transactions policies if they exist
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their transactions" ON public.transactions;

-- Create transactions policies
CREATE POLICY "Users can view their transactions" ON public.transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their transactions" ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.campaigns TO authenticated;
GRANT SELECT, INSERT ON public.transactions TO authenticated;

-- Grant usage on sequences (if they exist)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;
