-- Create user privacy settings table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_public_profile BOOLEAN DEFAULT true,
    show_network_overview BOOLEAN DEFAULT true,
    show_achievements BOOLEAN DEFAULT true,
    show_rank_history BOOLEAN DEFAULT true,
    show_activity BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id)
);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    achievement_icon VARCHAR(255),
    achievement_level VARCHAR(50) DEFAULT 'bronze',
    points_earned INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id, achievement_type, achievement_name)
);

-- Create user activity log table
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_description TEXT NOT NULL,
    points_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user rank history table
CREATE TABLE IF NOT EXISTS user_rank_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank_category VARCHAR(50) NOT NULL,
    rank_position INTEGER NOT NULL,
    points INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rank_history ENABLE ROW LEVEL SECURITY;

-- Privacy settings policies
CREATE POLICY "Users can view their own privacy settings" ON user_privacy_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings" ON user_privacy_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings" ON user_privacy_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Public achievements are viewable based on privacy settings" ON user_achievements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_privacy_settings ups 
            WHERE ups.user_id = user_achievements.user_id 
            AND ups.show_public_profile = true 
            AND ups.show_achievements = true
        )
        OR auth.uid() = user_id
    );

-- Activity log policies
CREATE POLICY "Public activity is viewable based on privacy settings" ON user_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_privacy_settings ups 
            WHERE ups.user_id = user_activity_log.user_id 
            AND ups.show_public_profile = true 
            AND ups.show_activity = true
        )
        OR auth.uid() = user_id
    );

-- Rank history policies
CREATE POLICY "Public rank history is viewable based on privacy settings" ON user_rank_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_privacy_settings ups 
            WHERE ups.user_id = user_rank_history.user_id 
            AND ups.show_public_profile = true 
            AND ups.show_rank_history = true
        )
        OR auth.uid() = user_id
    );

-- Insert default privacy settings for existing users
INSERT INTO user_privacy_settings (user_id, show_public_profile, show_network_overview, show_achievements, show_rank_history, show_activity)
SELECT id, true, true, true, true, false
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Create function to automatically create privacy settings for new users
CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_privacy_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
CREATE TRIGGER create_user_privacy_settings_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_privacy_settings();

-- Create some sample achievements
INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description, achievement_icon, achievement_level, points_earned)
SELECT 
    u.id,
    'milestone',
    'First Steps',
    'Completed your first task',
    'trophy',
    'bronze',
    100
FROM users u
LIMIT 5
ON CONFLICT (user_id, achievement_type, achievement_name) DO NOTHING;

-- Create some sample activities
INSERT INTO user_activity_log (user_id, activity_type, activity_description, points_earned)
SELECT 
    u.id,
    'task_completed',
    'Completed daily survey task',
    50
FROM users u
LIMIT 10
ON CONFLICT DO NOTHING;

-- Create some sample rank history
INSERT INTO user_rank_history (user_id, rank_category, rank_position, points)
SELECT 
    u.id,
    CASE WHEN u.isAgent THEN 'agent' ELSE 'regular' END,
    ROW_NUMBER() OVER (ORDER BY RANDOM()),
    FLOOR(RANDOM() * 10000) + 1000
FROM users u
LIMIT 20
ON CONFLICT DO NOTHING;
