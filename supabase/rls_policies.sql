
-- =============================================================================
-- EARNPRO ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- This script enables RLS on all tables and defines policies to protect data.
--
-- Key Principles:
-- 1. By default, no one can access any data.
-- 2. Policies grant specific access to users based on their role and ownership.
-- 3. Users can only see and manage their own data.
-- 4. Admins and Superadmins have elevated privileges.
-- =============================================================================

-- =============================================================================
-- Helper Functions
-- =============================================================================
-- Get the role of the currently authenticated user
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
DECLARE
  role user_role;
BEGIN
  SELECT u.role INTO role
  FROM public.users u
  WHERE u.id = auth.uid();
  RETURN role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Table: users
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can see their own profile
CREATE POLICY "Allow individual users to view their own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Allow individual users to update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Authenticated users can view basic info of other users (for referrals, etc.)
CREATE POLICY "Allow authenticated users to view basic public info"
ON public.users FOR SELECT
USING (auth.role() = 'authenticated');

-- Admins can view all user profiles
CREATE POLICY "Allow admins to view all user profiles"
ON public.users FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));

-- Admins can update all user profiles
CREATE POLICY "Allow admins to update all user profiles"
ON public.users FOR UPDATE
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: transactions
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can see their own transactions
CREATE POLICY "Allow users to view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

-- Admins can see all transactions
CREATE POLICY "Allow admins to view all transactions"
ON public.transactions FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: withdrawal_requests
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can manage their own withdrawal requests
CREATE POLICY "Allow users to manage their own withdrawal requests"
ON public.withdrawal_requests FOR ALL
USING (auth.uid() = user_id);

-- Admins can manage all withdrawal requests
CREATE POLICY "Allow admins to manage all withdrawal requests"
ON public.withdrawal_requests FOR ALL
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: agent_applications
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can manage their own agent applications
CREATE POLICY "Allow users to manage their own agent applications"
ON public.agent_applications FOR ALL
USING (auth.uid() = user_id);

-- Admins can manage all agent applications
CREATE POLICY "Allow admins to manage all agent applications"
ON public.agent_applications FOR ALL
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: advertiser_applications
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.advertiser_applications ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can manage their own advertiser applications
CREATE POLICY "Allow users to manage their own advertiser applications"
ON public.advertiser_applications FOR ALL
USING (auth.uid() = user_id);

-- Admins can manage all advertiser applications
CREATE POLICY "Allow admins to manage all advertiser applications"
ON public.advertiser_applications FOR ALL
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: campaigns
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Any authenticated user can view active campaigns
CREATE POLICY "Allow authenticated users to view active campaigns"
ON public.campaigns FOR SELECT
USING (status = 'active' AND auth.role() = 'authenticated');

-- Advertisers can manage their own campaigns
CREATE POLICY "Allow advertisers to manage their own campaigns"
ON public.campaigns FOR ALL
USING (auth.uid() = advertiser_id);

-- Admins can manage all campaigns
CREATE POLICY "Allow admins to manage all campaigns"
ON public.campaigns FOR ALL
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: referrals
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can see referrals they made or received
CREATE POLICY "Allow users to see their own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Admins can see all referrals
CREATE POLICY "Allow admins to see all referrals"
ON public.referrals FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: notifications
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can manage their own notifications
CREATE POLICY "Allow users to manage their own notifications"
ON public.notifications FOR ALL
USING (auth.uid() = user_id);

-- Admins can view all notifications (for debugging, etc)
CREATE POLICY "Allow admins to view all notifications"
ON public.notifications FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: user_sessions
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can manage their own sessions
CREATE POLICY "Allow users to manage their own sessions"
ON public.user_sessions FOR ALL
USING (auth.uid() = user_id);

