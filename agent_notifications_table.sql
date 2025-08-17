-- Agent Notifications Table for Real-time Communication
-- This table stores notifications sent from admin to agents

CREATE TABLE IF NOT EXISTS agent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agentId TEXT NOT NULL, -- Reference to user_id in agent_profiles
    type VARCHAR(50) NOT NULL CHECK (type IN ('tier_update', 'challenge_start', 'challenge_complete', 'challenge_failed', 'commission_update', 'status_change', 'notification')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Additional data for the notification
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_agent_notifications_agent 
        FOREIGN KEY (agentId) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent_id ON agent_notifications(agentId);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_timestamp ON agent_notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_read ON agent_notifications(read);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_type ON agent_notifications(type);

-- RLS policies for agent notifications
ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;

-- Agents can only see their own notifications
CREATE POLICY "Agents can view own notifications" 
    ON agent_notifications FOR SELECT 
    USING (agentId = auth.uid()::text);

-- Agents can update their own notifications (mark as read)
CREATE POLICY "Agents can update own notifications" 
    ON agent_notifications FOR UPDATE 
    USING (agentId = auth.uid()::text);

-- Admins can insert notifications for any agent
CREATE POLICY "Admins can insert notifications" 
    ON agent_notifications FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" 
    ON agent_notifications FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
        )
    );

-- Function to automatically clean up old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_agent_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM agent_notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup daily (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-agent-notifications', '0 2 * * *', 'SELECT cleanup_old_agent_notifications();');

COMMENT ON TABLE agent_notifications IS 'Stores real-time notifications sent from admin to agents';
COMMENT ON COLUMN agent_notifications.agentId IS 'References user_id from users table';
COMMENT ON COLUMN agent_notifications.type IS 'Type of notification for proper handling on frontend';
COMMENT ON COLUMN agent_notifications.data IS 'Additional structured data for the notification';
