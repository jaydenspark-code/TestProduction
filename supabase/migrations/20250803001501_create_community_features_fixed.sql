-- =====================================================
-- Community Features Database Schema (FIXED)
-- =====================================================
-- This migration fixes conflicts with existing tables

-- First, check and handle existing user_achievements table
DO $$
BEGIN
    -- Check if the existing user_achievements table needs to be updated
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'metadata') THEN
            ALTER TABLE user_achievements ADD COLUMN metadata JSONB DEFAULT '{}';
        END IF;
        
        -- Update achievement_level to NOT NULL if it's nullable and add check constraint
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'achievement_level' AND is_nullable = 'YES') THEN
            -- First update null values to 'bronze'
            UPDATE user_achievements SET achievement_level = 'bronze' WHERE achievement_level IS NULL;
            -- Then make it NOT NULL
            ALTER TABLE user_achievements ALTER COLUMN achievement_level SET NOT NULL;
        END IF;
        
        -- Add check constraint if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'user_achievements_achievement_level_check') THEN
            ALTER TABLE user_achievements ADD CONSTRAINT user_achievements_achievement_level_check 
            CHECK (achievement_level IN ('bronze', 'silver', 'gold', 'platinum', 'diamond'));
        END IF;
        
        -- Add unique constraint if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_achievements_user_id_achievement_type_achievement_level_key') THEN
            -- Remove duplicates first using row_number
            DELETE FROM user_achievements WHERE id IN (
                SELECT id FROM (
                    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, achievement_type, achievement_level ORDER BY earned_at) as rn
                    FROM user_achievements
                ) t WHERE rn > 1
            );
            -- Add unique constraint
            ALTER TABLE user_achievements ADD CONSTRAINT user_achievements_user_id_achievement_type_achievement_level_key 
            UNIQUE(user_id, achievement_type, achievement_level);
        END IF;
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE user_achievements (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            achievement_type VARCHAR(100) NOT NULL,
            achievement_name VARCHAR(255) NOT NULL,
            achievement_description TEXT,
            achievement_icon TEXT,
            achievement_level VARCHAR(20) NOT NULL CHECK (achievement_level IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
            points_earned INTEGER DEFAULT 0,
            metadata JSONB DEFAULT '{}',
            earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, achievement_type, achievement_level)
        );
    END IF;
END $$;

-- Success Stories Table
CREATE TABLE IF NOT EXISTS success_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('earnings', 'referrals', 'growth', 'milestone', 'achievement')),
    metrics JSONB DEFAULT '{}',
    image_url TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'pending_review')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Challenges Table
CREATE TABLE IF NOT EXISTS community_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('referral', 'earnings', 'tasks', 'social', 'streak')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_participants INTEGER,
    requirements JSONB NOT NULL,
    rewards JSONB NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge Participants Table
CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES community_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_progress DECIMAL(10,2) DEFAULT 0,
    rank INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

-- User Reviews Table
CREATE TABLE IF NOT EXISTS user_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    category VARCHAR(50) NOT NULL CHECK (category IN ('platform', 'support', 'earnings', 'community', 'features')),
    tags TEXT[] DEFAULT '{}',
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_helpful BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'pending_review')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review Responses Table
CREATE TABLE IF NOT EXISTS review_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES user_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_admin_response BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_type VARCHAR(100) NOT NULL,
    badge_name VARCHAR(255) NOT NULL,
    badge_description TEXT,
    badge_icon TEXT,
    badge_color VARCHAR(20) DEFAULT 'blue',
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, badge_type)
);

-- Story Likes Table
CREATE TABLE IF NOT EXISTS story_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES success_stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- Review Likes Table
CREATE TABLE IF NOT EXISTS review_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES user_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_like BOOLEAN NOT NULL, -- true for like, false for dislike
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Create indexes for better performance (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_success_stories_user_id') THEN
        CREATE INDEX idx_success_stories_user_id ON success_stories(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_success_stories_category') THEN
        CREATE INDEX idx_success_stories_category ON success_stories(category);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_success_stories_created_at') THEN
        CREATE INDEX idx_success_stories_created_at ON success_stories(created_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_success_stories_status') THEN
        CREATE INDEX idx_success_stories_status ON success_stories(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_community_challenges_status') THEN
        CREATE INDEX idx_community_challenges_status ON community_challenges(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_community_challenges_type') THEN
        CREATE INDEX idx_community_challenges_type ON community_challenges(type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_community_challenges_dates') THEN
        CREATE INDEX idx_community_challenges_dates ON community_challenges(start_date, end_date);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_challenge_participants_challenge_id') THEN
        CREATE INDEX idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_challenge_participants_user_id') THEN
        CREATE INDEX idx_challenge_participants_user_id ON challenge_participants(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_challenge_participants_rank') THEN
        CREATE INDEX idx_challenge_participants_rank ON challenge_participants(challenge_id, rank);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_reviews_user_id') THEN
        CREATE INDEX idx_user_reviews_user_id ON user_reviews(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_reviews_category') THEN
        CREATE INDEX idx_user_reviews_category ON user_reviews(category);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_reviews_rating') THEN
        CREATE INDEX idx_user_reviews_rating ON user_reviews(rating);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_reviews_created_at') THEN
        CREATE INDEX idx_user_reviews_created_at ON user_reviews(created_at DESC);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_achievements_user_id') THEN
        CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_achievements_type') THEN
        CREATE INDEX idx_user_achievements_type ON user_achievements(achievement_type);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_badges_user_id') THEN
        CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_badges_active') THEN
        CREATE INDEX idx_user_badges_active ON user_badges(user_id, is_active);
    END IF;
END $$;

-- Create update_updated_at_column function if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Create triggers for updated_at columns (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_success_stories_updated_at') THEN
        CREATE TRIGGER update_success_stories_updated_at 
            BEFORE UPDATE ON success_stories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_community_challenges_updated_at') THEN
        CREATE TRIGGER update_community_challenges_updated_at 
            BEFORE UPDATE ON community_challenges
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_reviews_updated_at') THEN
        CREATE TRIGGER update_user_reviews_updated_at 
            BEFORE UPDATE ON user_reviews
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Row Level Security (RLS) Policies
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
    -- Success Stories Policies
    BEGIN
        DROP POLICY IF EXISTS "Public can view active success stories" ON success_stories;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Public can view active success stories" ON success_stories
        FOR SELECT USING (status = 'active');

    BEGIN
        DROP POLICY IF EXISTS "Users can create own success stories" ON success_stories;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can create own success stories" ON success_stories
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    BEGIN
        DROP POLICY IF EXISTS "Users can update own success stories" ON success_stories;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can update own success stories" ON success_stories
        FOR UPDATE USING (auth.uid() = user_id);

    -- Community Challenges Policies
    BEGIN
        DROP POLICY IF EXISTS "Public can view active challenges" ON community_challenges;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Public can view active challenges" ON community_challenges
        FOR SELECT USING (status IN ('active', 'upcoming'));

    BEGIN
        DROP POLICY IF EXISTS "Admins can manage challenges" ON community_challenges;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Admins can manage challenges" ON community_challenges
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('admin', 'superadmin')
            )
        );

    -- Challenge Participants Policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view challenge participants" ON challenge_participants;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can view challenge participants" ON challenge_participants
        FOR SELECT USING (TRUE);

    BEGIN
        DROP POLICY IF EXISTS "Users can join challenges" ON challenge_participants;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can join challenges" ON challenge_participants
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    BEGIN
        DROP POLICY IF EXISTS "Users can update own participation" ON challenge_participants;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can update own participation" ON challenge_participants
        FOR UPDATE USING (auth.uid() = user_id);

    -- User Reviews Policies
    BEGIN
        DROP POLICY IF EXISTS "Public can view active reviews" ON user_reviews;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Public can view active reviews" ON user_reviews
        FOR SELECT USING (status = 'active');

    BEGIN
        DROP POLICY IF EXISTS "Users can create own reviews" ON user_reviews;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can create own reviews" ON user_reviews
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    BEGIN
        DROP POLICY IF EXISTS "Users can update own reviews" ON user_reviews;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can update own reviews" ON user_reviews
        FOR UPDATE USING (auth.uid() = user_id);

    -- Review Responses Policies
    BEGIN
        DROP POLICY IF EXISTS "Public can view review responses" ON review_responses;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Public can view review responses" ON review_responses
        FOR SELECT USING (TRUE);

    BEGIN
        DROP POLICY IF EXISTS "Users can create review responses" ON review_responses;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can create review responses" ON review_responses
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- User Achievements Policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can view own achievements" ON user_achievements
        FOR SELECT USING (auth.uid() = user_id);

    BEGIN
        DROP POLICY IF EXISTS "System can create achievements" ON user_achievements;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "System can create achievements" ON user_achievements
        FOR INSERT WITH CHECK (TRUE);

    -- User Badges Policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can view own badges" ON user_badges
        FOR SELECT USING (auth.uid() = user_id);

    BEGIN
        DROP POLICY IF EXISTS "System can create badges" ON user_badges;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "System can create badges" ON user_badges
        FOR INSERT WITH CHECK (TRUE);

    -- Likes Policies
    BEGIN
        DROP POLICY IF EXISTS "Users can manage own likes" ON story_likes;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can manage own likes" ON story_likes
        FOR ALL USING (auth.uid() = user_id);

    BEGIN
        DROP POLICY IF EXISTS "Users can manage own review likes" ON review_likes;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can manage own review likes" ON review_likes
        FOR ALL USING (auth.uid() = user_id);
END $$;

-- Insert some sample data (only if tables are empty)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM community_challenges) THEN
        INSERT INTO community_challenges (title, description, type, difficulty, status, start_date, end_date, requirements, rewards) VALUES
        ('Welcome Challenge', 'Complete your first referral to get started!', 'referral', 'easy', 'active', 
         NOW(), NOW() + INTERVAL '30 days',
         '{"target": 1, "metric": "referrals", "timeframe": "30 days"}',
         '{"first": {"amount": 50, "badge": "First Referral"}, "participation": {"amount": 10, "badge": "Challenger"}}'),
         
        ('Monthly Earnings Goal', 'Earn $100 this month', 'earnings', 'medium', 'active',
         DATE_TRUNC('month', NOW()), DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
         '{"target": 100, "metric": "dollars earned", "timeframe": "1 month"}',
         '{"first": {"amount": 200, "badge": "Top Earner"}, "second": {"amount": 100, "badge": "Great Earner"}, "participation": {"amount": 25, "badge": "Monthly Participant"}}');
    END IF;

    -- Insert sample achievements only if user exists
    IF EXISTS (SELECT 1 FROM users LIMIT 1) AND NOT EXISTS (SELECT 1 FROM user_achievements WHERE achievement_type = 'first_referral') THEN
        INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description, achievement_level, points_earned)
        SELECT id, 'first_referral', 'First Referral', 'Made your first successful referral', 'bronze', 100
        FROM users LIMIT 1;
    END IF;

    -- Insert sample badges only if user exists
    IF EXISTS (SELECT 1 FROM users LIMIT 1) AND NOT EXISTS (SELECT 1 FROM user_badges WHERE badge_type = 'newcomer') THEN
        INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description, badge_color)
        SELECT id, 'newcomer', 'Welcome to EarnPro', 'New member badge', 'blue'
        FROM users LIMIT 1;
    END IF;
END $$;

-- Final success message
SELECT 'Community features migration completed successfully!' as message;
