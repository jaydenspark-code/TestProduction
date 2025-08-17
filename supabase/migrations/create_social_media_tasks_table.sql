-- Social Media Tasks Table for tracking user social media onboarding
CREATE TABLE IF NOT EXISTS social_media_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'telegram', 'youtube', etc.
    platform_name VARCHAR(100) NOT NULL,
    reward_amount DECIMAL(10,2) NOT NULL DEFAULT 0.25,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_platform UNIQUE(user_id, platform),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT valid_platform CHECK (platform IN ('telegram', 'youtube', 'instagram', 'twitter', 'tiktok')),
    CONSTRAINT positive_reward CHECK (reward_amount >= 0)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_media_tasks_user_id ON social_media_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_tasks_platform ON social_media_tasks(platform);
CREATE INDEX IF NOT EXISTS idx_social_media_tasks_status ON social_media_tasks(status);
CREATE INDEX IF NOT EXISTS idx_social_media_tasks_completed_at ON social_media_tasks(completed_at);

-- RLS Policies
ALTER TABLE social_media_tasks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own social media tasks
CREATE POLICY "Users can view own social media tasks" ON social_media_tasks
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own social media tasks
CREATE POLICY "Users can insert own social media tasks" ON social_media_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own social media tasks
CREATE POLICY "Users can update own social media tasks" ON social_media_tasks
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_media_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_social_media_tasks_updated_at
    BEFORE UPDATE ON social_media_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_social_media_tasks_updated_at();

-- Comments for documentation
COMMENT ON TABLE social_media_tasks IS 'Tracks user completion of social media platform joining tasks';
COMMENT ON COLUMN social_media_tasks.platform IS 'The social media platform identifier (telegram, youtube, etc.)';
COMMENT ON COLUMN social_media_tasks.reward_amount IS 'Amount earned for completing this platform task';
COMMENT ON COLUMN social_media_tasks.status IS 'Current status of the task (pending, completed, failed)';
