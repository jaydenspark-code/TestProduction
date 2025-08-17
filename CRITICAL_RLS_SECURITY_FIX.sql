-- CRITICAL SECURITY FIX: Enable Row Level Security (RLS) for All Public Tables
-- This addresses the Supabase Security Advisor warnings about RLS being disabled

-- ============================================================================
-- STEP 1: Enable RLS on all public tables that are exposed to PostgREST
-- ============================================================================

-- Enable RLS on support_conversations table
ALTER TABLE IF EXISTS public.support_conversations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on support_tickets table  
ALTER TABLE IF EXISTS public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Enable RLS on agent_notifications table
ALTER TABLE IF EXISTS public.agent_notifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on support_knowledge_base table
ALTER TABLE IF EXISTS public.support_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Enable RLS on chat_sessions table
ALTER TABLE IF EXISTS public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table (if not already enabled)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables that might be missing RLS
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advertiser_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop existing policies to avoid conflicts
-- ============================================================================

-- Support conversations policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Agents can view assigned conversations" ON public.support_conversations;

-- Support tickets policies
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can insert tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Agents can view assigned tickets" ON public.support_tickets;

-- Agent notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.agent_notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.agent_notifications;

-- Knowledge base policies
DROP POLICY IF EXISTS "Knowledge base is publicly readable" ON public.support_knowledge_base;
DROP POLICY IF EXISTS "Admins can manage knowledge base" ON public.support_knowledge_base;

-- Chat sessions policies
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can insert chat sessions" ON public.chat_sessions;

-- ============================================================================
-- STEP 3: Create comprehensive RLS policies for all tables
-- ============================================================================

-- SUPPORT CONVERSATIONS POLICIES
CREATE POLICY "Users can view own conversations" ON public.support_conversations
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

CREATE POLICY "Users can insert conversations" ON public.support_conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Agents can update conversations" ON public.support_conversations
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

-- SUPPORT TICKETS POLICIES
CREATE POLICY "Users can view own tickets" ON public.support_tickets
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

CREATE POLICY "Users can insert tickets" ON public.support_tickets
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Agents can update tickets" ON public.support_tickets
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

-- AGENT NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON public.agent_notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.agent_notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Allow system to create notifications

CREATE POLICY "Users can update own notifications" ON public.agent_notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- KNOWLEDGE BASE POLICIES
CREATE POLICY "Knowledge base is publicly readable" ON public.support_knowledge_base
    FOR SELECT
    TO authenticated, anon
    USING (is_published = true);

CREATE POLICY "Admins can manage knowledge base" ON public.support_knowledge_base
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- CHAT SESSIONS POLICIES
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert chat sessions" ON public.chat_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- STEP 4: Enhanced policies for core tables
-- ============================================================================

-- Enhanced USERS table policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admin full access" ON public.users;

CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin full access users" ON public.users
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Enhanced REFERRALS table policies
DROP POLICY IF EXISTS "Users can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;

CREATE POLICY "Users can insert referrals" ON public.referrals
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can view their referrals" ON public.referrals
    FOR SELECT
    TO authenticated
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Enhanced CAMPAIGNS table policies
DROP POLICY IF EXISTS "Users can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;

CREATE POLICY "Users can view campaigns" ON public.campaigns
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert campaigns" ON public.campaigns
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own campaigns" ON public.campaigns
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_id);

-- Enhanced TRANSACTIONS table policies
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Allow system to create transactions

-- WITHDRAWALS table policies
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert withdrawals" ON public.withdrawals
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- EARNINGS table policies
CREATE POLICY "Users can view own earnings" ON public.earnings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert earnings" ON public.earnings
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Allow system to create earnings

-- AGENT APPLICATIONS table policies
CREATE POLICY "Users can view own agent applications" ON public.agent_applications
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Users can insert agent applications" ON public.agent_applications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ADVERTISER APPLICATIONS table policies
CREATE POLICY "Users can view own advertiser applications" ON public.advertiser_applications
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Users can insert advertiser applications" ON public.advertiser_applications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS table policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Allow system to create notifications

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: Grant necessary permissions
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.support_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.agent_notifications TO authenticated;
GRANT SELECT ON public.support_knowledge_base TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.chat_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.campaigns TO authenticated;
GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT SELECT, INSERT ON public.withdrawals TO authenticated;
GRANT SELECT, INSERT ON public.earnings TO authenticated;
GRANT SELECT, INSERT ON public.agent_applications TO authenticated;
GRANT SELECT, INSERT ON public.advertiser_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant anonymous access where needed
GRANT SELECT ON public.support_knowledge_base TO anon;

-- ============================================================================
-- STEP 6: Verification queries
-- ============================================================================

-- Run these queries to verify RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND rowsecurity = false;

-- This should return no rows if all tables have RLS enabled

COMMIT;
