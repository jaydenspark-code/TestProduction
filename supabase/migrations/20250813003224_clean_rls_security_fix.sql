-- Clean RLS Security Fix for Critical Tables
-- Addresses specific tables mentioned in Supabase Security Advisor

-- Only attempt to fix tables if they exist
DO $$
BEGIN
    -- Support Conversations Table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_conversations') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own support conversations" ON support_conversations;
        DROP POLICY IF EXISTS "Users can insert own support conversations" ON support_conversations;
        DROP POLICY IF EXISTS "Admins can view all support conversations" ON support_conversations;
        DROP POLICY IF EXISTS "Service role can manage support conversations" ON support_conversations;
        
        -- Enable RLS
        ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own support conversations" ON support_conversations
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own support conversations" ON support_conversations
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Admins can view all support conversations" ON support_conversations
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'superadmin', 'agent')
                )
            );
        
        CREATE POLICY "Service role can manage support conversations" ON support_conversations
            FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- Support Tickets Table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_tickets') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own support tickets" ON support_tickets;
        DROP POLICY IF EXISTS "Users can insert own support tickets" ON support_tickets;
        DROP POLICY IF EXISTS "Users can update own support tickets" ON support_tickets;
        DROP POLICY IF EXISTS "Admins can view all support tickets" ON support_tickets;
        DROP POLICY IF EXISTS "Admins can update all support tickets" ON support_tickets;
        DROP POLICY IF EXISTS "Service role can manage support tickets" ON support_tickets;
        
        -- Enable RLS
        ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own support tickets" ON support_tickets
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own support tickets" ON support_tickets
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own support tickets" ON support_tickets
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Admins can view all support tickets" ON support_tickets
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'superadmin', 'agent')
                )
            );
        
        CREATE POLICY "Admins can update all support tickets" ON support_tickets
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'superadmin', 'agent')
                )
            );
        
        CREATE POLICY "Service role can manage support tickets" ON support_tickets
            FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- Agent Notifications Table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_notifications') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Support agents can view agent notifications" ON agent_notifications;
        DROP POLICY IF EXISTS "Support agents can insert agent notifications" ON agent_notifications;
        DROP POLICY IF EXISTS "Support agents can update agent notifications" ON agent_notifications;
        DROP POLICY IF EXISTS "Service role can manage agent notifications" ON agent_notifications;
        
        -- Enable RLS
        ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Support agents can view agent notifications" ON agent_notifications
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'superadmin', 'agent')
                )
            );
        
        CREATE POLICY "Support agents can insert agent notifications" ON agent_notifications
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'superadmin', 'agent')
                )
            );
        
        CREATE POLICY "Support agents can update agent notifications" ON agent_notifications
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'superadmin', 'agent')
                )
            );
        
        CREATE POLICY "Service role can manage agent notifications" ON agent_notifications
            FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- Support Knowledge Base Table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_knowledge_base') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Authenticated users can read knowledge base" ON support_knowledge_base;
        DROP POLICY IF EXISTS "Anonymous users can read active knowledge base" ON support_knowledge_base;
        DROP POLICY IF EXISTS "Admins can manage knowledge base" ON support_knowledge_base;
        DROP POLICY IF EXISTS "Service role can manage knowledge base" ON support_knowledge_base;
        
        -- Enable RLS
        ALTER TABLE support_knowledge_base ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Authenticated users can read knowledge base" ON support_knowledge_base
            FOR SELECT USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Anonymous users can read active knowledge base" ON support_knowledge_base
            FOR SELECT USING (is_active = true);
        
        CREATE POLICY "Admins can manage knowledge base" ON support_knowledge_base
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'superadmin', 'agent')
                )
            );
        
        CREATE POLICY "Service role can manage knowledge base" ON support_knowledge_base
            FOR ALL USING (auth.role() = 'service_role');
    END IF;

    -- Chat Sessions Table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_sessions') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
        DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
        DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
        DROP POLICY IF EXISTS "Admins can view all chat sessions" ON chat_sessions;
        DROP POLICY IF EXISTS "Admins can update all chat sessions" ON chat_sessions;
        DROP POLICY IF EXISTS "Service role can manage chat sessions" ON chat_sessions;
        
        -- Enable RLS
        ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own chat sessions" ON chat_sessions
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own chat sessions" ON chat_sessions
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Admins can view all chat sessions" ON chat_sessions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'superadmin', 'agent')
                )
            );
        
        CREATE POLICY "Admins can update all chat sessions" ON chat_sessions
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'superadmin', 'agent')
                )
            );
        
        CREATE POLICY "Service role can manage chat sessions" ON chat_sessions
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;
