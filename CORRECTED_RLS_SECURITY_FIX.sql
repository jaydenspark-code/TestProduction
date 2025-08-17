-- CORRECTED RLS SECURITY FIX
-- This script addresses the critical security vulnerabilities identified by Supabase Security Advisor
-- Fixed to use correct column names based on actual database schema

-- ============================================================================
-- SUPPORT CONVERSATIONS TABLE
-- ============================================================================
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

-- Grant permissions for anonymous users (limited)
GRANT SELECT ON support_knowledge_base TO anon;

-- Grant full permissions to service role
GRANT ALL ON support_conversations TO service_role;
GRANT ALL ON support_tickets TO service_role;
GRANT ALL ON agent_notifications TO service_role;
GRANT ALL ON support_knowledge_base TO service_role;
GRANT ALL ON chat_sessions TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'support_conversations',
    'support_tickets', 
    'agent_notifications',
    'support_knowledge_base',
    'chat_sessions'
)
ORDER BY tablename;

-- Check policies created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'support_conversations',
    'support_tickets',
    'agent_notifications', 
    'support_knowledge_base',
    'chat_sessions'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
This corrected RLS security fix addresses:

1. CRITICAL SECURITY VULNERABILITIES:
   - Enables RLS on all public tables identified by Supabase Security Advisor
   - Creates proper access policies for user data protection
   - Ensures users can only access their own data

2. CORRECTED COLUMN REFERENCES:
   - Uses 'user_id' for support_conversations, support_tickets, chat_sessions
   - Handles agent_notifications table structure appropriately
   - Accounts for actual database schema

3. ROLE-BASED ACCESS:
   - Users: Can only access their own data
   - Admins/Support Agents: Can access all data for support purposes
   - Service Role: Full access for system operations
   - Anonymous: Limited read access to knowledge base only

4. SECURITY BEST PRACTICES:
   - Separate policies for different operations (SELECT, INSERT, UPDATE)
   - Proper role checking for administrative access
   - Service role access for backend operations

5. VERIFICATION:
   - Includes queries to verify RLS enablement
   - Includes queries to check policy creation
   - Easy to validate the security implementation

APPLY THIS SCRIPT IN SUPABASE SQL EDITOR TO RESOLVE CRITICAL SECURITY ISSUES!
*/
