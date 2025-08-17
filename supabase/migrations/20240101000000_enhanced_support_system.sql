-- Enhanced Support System Tables
-- This migration adds tables for improved chat support, ticketing, and agent management

-- Support Conversations Table (for chat analytics)
CREATE TABLE IF NOT EXISTS support_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.5,
    source VARCHAR(20) DEFAULT 'knowledge_base' CHECK (source IN ('knowledge_base', 'ai', 'escalation')),
    requires_human BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support Tickets Table (for escalations and human support)
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    source VARCHAR(20) NOT NULL DEFAULT 'live_chat' CHECK (source IN ('live_chat', 'contact_form', 'email', 'phone')),
    category VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_agent UUID,
    user_email VARCHAR(255),
    user_phone VARCHAR(50),
    user_context JSONB,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent Notifications Table (for support team alerts)
CREATE TABLE IF NOT EXISTS agent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    priority VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30) NOT NULL DEFAULT 'support_escalation',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support Knowledge Base Table (for dynamic responses)
CREATE TABLE IF NOT EXISTS support_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    keywords TEXT[] NOT NULL,
    response_template TEXT NOT NULL,
    suggestions TEXT[] DEFAULT '{}',
    context_rules JSONB,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Session Analytics Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    escalated_to_human BOOLEAN DEFAULT false,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    resolved BOOLEAN DEFAULT false,
    average_response_time DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_created_at ON support_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_ticket_id ON agent_notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_read_at ON agent_notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_support_knowledge_base_category ON support_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);

-- Insert default knowledge base entries
INSERT INTO support_knowledge_base (category, keywords, response_template, suggestions, priority) VALUES
(
    'referral_system',
    ARRAY['referral', 'refer', 'link', 'share', 'invite', 'commission', 'multi-level'],
    'EarnPro''s referral system allows you to earn from 3 levels: Direct referrals (Level 1), their referrals (Level 2), and their referrals (Level 3). Share your unique link to start earning commissions!',
    ARRAY['How much per referral?', 'Multi-level explained', 'Share referral link', 'Track referrals'],
    1
),
(
    'daily_tasks',
    ARRAY['task', 'daily', 'video', 'telegram', 'watch', 'complete'],
    'Complete daily tasks to boost earnings! Watch videos (80% minimum), join Telegram channels, and engage with social content. Tasks unlock progressively.',
    ARRAY['Video completion tips', 'Telegram verification', 'Task schedule', 'Requirements'],
    1
),
(
    'payments',
    ARRAY['payment', 'withdraw', 'payout', 'money', 'earnings'],
    'All payments are processed within 24 hours via PayPal, bank transfer, or cryptocurrency. Minimum withdrawal amounts vary by country and payment method.',
    ARRAY['Payment methods', 'Processing time', 'Minimum amounts', 'Agent benefits'],
    1
),
(
    'agent_program',
    ARRAY['agent', 'influencer', 'program', 'milestone', 'commission'],
    'The Agent Program offers enhanced earnings for content creators: 5-20% progressive weekly commissions, milestone bonuses, and priority withdrawals.',
    ARRAY['Requirements', 'Commission rates', 'Application process', 'Benefits'],
    1
),
(
    'account_issues',
    ARRAY['account', 'login', 'password', 'verification', 'locked'],
    'Account issues need immediate attention. Try password reset for login problems, ensure clear documents for verification, or contact support for restrictions.',
    ARRAY['Reset password', 'Verify account', 'Contact support', 'Account security'],
    2
)
ON CONFLICT DO NOTHING;

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON support_tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_knowledge_base_updated_at 
    BEFORE UPDATE ON support_knowledge_base 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant appropriate permissions
GRANT SELECT, INSERT ON support_conversations TO authenticated;
GRANT SELECT, INSERT ON support_tickets TO authenticated;
GRANT SELECT ON support_knowledge_base TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_sessions TO authenticated;

-- Allow service role to manage everything
GRANT ALL ON support_conversations TO service_role;
GRANT ALL ON support_tickets TO service_role;
GRANT ALL ON agent_notifications TO service_role;
GRANT ALL ON support_knowledge_base TO service_role;
GRANT ALL ON chat_sessions TO service_role;
