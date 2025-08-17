-- CORRECTED RLS SECURITY FIX
-- This script addresses the critical security vulnerabilities identified by Supabase Security Advisor
-- Fixed to use correct column names and enum values based on actual database schema

-- ============================================================================
-- SUPPORT CONVERSATIONS TABLE
-- ============================================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own support conversations" ON support_conversations;
DROP POLICY IF EXISTS "Users can insert own support conversations" ON support_conversations;
DROP POLICY IF EXISTS "Admins can view all support conversations" ON support_conversations;
DROP POLICY IF EXISTS "Service role can manage support conversations" ON support_conversations;

-- Enable RLS for support_conversations
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own conversations
CREATE POLICY "Users can view own support conversations" ON support_conversations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own conversations
CREATE POLICY "Users can insert own support conversations" ON support_conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Admins and support agents can view all conversations
CREATE POLICY "Admins can view all support conversations" ON support_conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

-- Policy: Service role can manage all conversations
CREATE POLICY "Service role can manage support conversations" ON support_conversations
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- SUPPORT TICKETS TABLE
-- ============================================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can insert own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Service role can manage support tickets" ON support_tickets;

-- Enable RLS for support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view own support tickets" ON support_tickets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own tickets
CREATE POLICY "Users can insert own support tickets" ON support_tickets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tickets (limited fields)
CREATE POLICY "Users can update own support tickets" ON support_tickets
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Admins and support agents can view all tickets
CREATE POLICY "Admins can view all support tickets" ON support_tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

-- Policy: Admins and support agents can update all tickets
CREATE POLICY "Admins can update all support tickets" ON support_tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

-- Policy: Service role can manage all tickets
CREATE POLICY "Service role can manage support tickets" ON support_tickets
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- AGENT NOTIFICATIONS TABLE (Support System)
-- ============================================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Support agents can view agent notifications" ON agent_notifications;
DROP POLICY IF EXISTS "Support agents can insert agent notifications" ON agent_notifications;
DROP POLICY IF EXISTS "Support agents can update agent notifications" ON agent_notifications;
DROP POLICY IF EXISTS "Service role can manage agent notifications" ON agent_notifications;

-- Enable RLS for agent_notifications (support system version)
ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and support agents can view all notifications
CREATE POLICY "Support agents can view agent notifications" ON agent_notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

-- Policy: Admins and support agents can insert notifications
CREATE POLICY "Support agents can insert agent notifications" ON agent_notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

-- Policy: Admins and support agents can update notifications
CREATE POLICY "Support agents can update agent notifications" ON agent_notifications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

-- Policy: Service role can manage all notifications
CREATE POLICY "Service role can manage agent notifications" ON agent_notifications
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- SUPPORT KNOWLEDGE BASE TABLE
-- ============================================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read knowledge base" ON support_knowledge_base;
DROP POLICY IF EXISTS "Anonymous users can read active knowledge base" ON support_knowledge_base;
DROP POLICY IF EXISTS "Admins can manage knowledge base" ON support_knowledge_base;
DROP POLICY IF EXISTS "Service role can manage knowledge base" ON support_knowledge_base;

-- Enable RLS for support_knowledge_base
ALTER TABLE support_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read knowledge base
CREATE POLICY "Authenticated users can read knowledge base" ON support_knowledge_base
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Anonymous users can read active knowledge base entries
CREATE POLICY "Anonymous users can read active knowledge base" ON support_knowledge_base
    FOR SELECT
    USING (is_active = true);

-- Policy: Admins and support agents can manage knowledge base
CREATE POLICY "Admins can manage knowledge base" ON support_knowledge_base
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

-- Policy: Service role can manage knowledge base
CREATE POLICY "Service role can manage knowledge base" ON support_knowledge_base
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- CHAT SESSIONS TABLE
-- ============================================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Admins can view all chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Admins can update all chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Service role can manage chat sessions" ON chat_sessions;

-- Enable RLS for chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own chat sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own chat sessions
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own chat sessions
CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Admins and support agents can view all chat sessions
CREATE POLICY "Admins can view all chat sessions" ON chat_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

-- Policy: Admins and support agents can update all chat sessions
CREATE POLICY "Admins can update all chat sessions" ON chat_sessions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin', 'agent')
        )
    );

-- Policy: Service role can manage all chat sessions
CREATE POLICY "Service role can manage chat sessions" ON chat_sessions
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant permissions for authenticated users
GRANT SELECT, INSERT ON support_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON support_tickets TO authenticated;
GRANT SELECT ON support_knowledge_base TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_sessions TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON support_conversations TO service_role;
GRANT ALL ON support_tickets TO service_role;
GRANT ALL ON agent_notifications TO service_role;
GRANT ALL ON support_knowledge_base TO service_role;
GRANT ALL ON chat_sessions TO service_role;
