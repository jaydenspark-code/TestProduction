-- =============================================================================
-- ADVERTISING PLATFORM MIGRATION FOR EARNPRO (FIXED)
-- =============================================================================
-- This migration adds advertising platform functionality to the database
-- Fixed to handle existing tables and constraints

-- Create additional enum types for advertising features (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_activity_type') THEN
        CREATE TYPE ad_activity_type AS ENUM ('view', 'click', 'complete', 'share', 'like');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_campaign_type') THEN
        CREATE TYPE ad_campaign_type AS ENUM ('display', 'video', 'interactive', 'survey');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_campaign_status') THEN
        CREATE TYPE ad_campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
    END IF;
END $$;

-- =============================================================================
-- ADVERTISING TABLES
-- =============================================================================

-- Ad Campaigns table (separate from referral campaigns)
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}', -- Ad creative content (images, videos, text)
    target_audience JSONB DEFAULT '{}', -- Targeting criteria
    campaign_type ad_campaign_type NOT NULL DEFAULT 'display',
    budget DECIMAL(10,2) NOT NULL,
    cost_per_action DECIMAL(10,2) NOT NULL, -- CPA rate
    max_budget DECIMAL(10,2),
    daily_budget DECIMAL(10,2),
    frequency_cap INTEGER DEFAULT 3, -- Max times shown to same user per day
    status ad_campaign_status DEFAULT 'draft',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activities table for ad interactions
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    activity_type ad_activity_type NOT NULL,
    reward_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    metadata JSONB DEFAULT '{}', -- Additional tracking data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Metrics table for performance tracking
CREATE TABLE IF NOT EXISTS campaign_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    total_earned DECIMAL(10,2) DEFAULT 0.00, -- User earnings from this campaign
    click_through_rate DECIMAL(5,4) DEFAULT 0.0000, -- CTR as percentage
    completion_rate DECIMAL(5,4) DEFAULT 0.0000, -- Completion rate as percentage
    average_engagement_time INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Ad Frequency table to track ad exposure
CREATE TABLE IF NOT EXISTS user_ad_frequency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    view_count INTEGER DEFAULT 0,
    last_shown_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraints only if they don't exist
DO $$
BEGIN
    -- For user_activities: Since we can't use expressions in unique constraints,
    -- we'll just ensure no duplicate activities per user per campaign per day at the application level
    -- and add a regular unique constraint on (user_id, campaign_id, activity_type, created_at)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'user_activities_user_campaign_activity_unique' 
                   AND table_name = 'user_activities') THEN
        -- Remove exact duplicates first
        DELETE FROM user_activities WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, campaign_id, activity_type, created_at ORDER BY id) as rn
                FROM user_activities
            ) t WHERE rn > 1
        );
        -- Add unique constraint
        ALTER TABLE user_activities ADD CONSTRAINT user_activities_user_campaign_activity_unique 
        UNIQUE (user_id, campaign_id, activity_type, created_at);
    END IF;
    
    -- For campaign_metrics: One metrics record per campaign per day
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'campaign_metrics_campaign_id_date_key' 
                   AND table_name = 'campaign_metrics') THEN
        -- Remove duplicates first using row_number
        DELETE FROM campaign_metrics WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY campaign_id, date ORDER BY created_at) as rn
                FROM campaign_metrics
            ) t WHERE rn > 1
        );
        -- Add unique constraint
        ALTER TABLE campaign_metrics ADD CONSTRAINT campaign_metrics_campaign_id_date_key 
        UNIQUE (campaign_id, date);
    END IF;
    
    -- For user_ad_frequency: One record per user per campaign per day
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'user_ad_frequency_user_id_campaign_id_date_key' 
                   AND table_name = 'user_ad_frequency') THEN
        -- Remove duplicates first using row_number
        DELETE FROM user_ad_frequency WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, campaign_id, date ORDER BY created_at) as rn
                FROM user_ad_frequency
            ) t WHERE rn > 1
        );
        -- Add unique constraint
        ALTER TABLE user_ad_frequency ADD CONSTRAINT user_ad_frequency_user_id_campaign_id_date_key 
        UNIQUE (user_id, campaign_id, date);
    END IF;
END $$;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Create indexes only if they don't exist
DO $$
BEGIN
    -- Ad Campaigns indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ad_campaigns_advertiser_id') THEN
        CREATE INDEX idx_ad_campaigns_advertiser_id ON ad_campaigns(advertiser_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ad_campaigns_status') THEN
        CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ad_campaigns_type') THEN
        CREATE INDEX idx_ad_campaigns_type ON ad_campaigns(campaign_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ad_campaigns_dates') THEN
        CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);
    END IF;

    -- User Activities indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activities_user_id') THEN
        CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activities_campaign_id') THEN
        CREATE INDEX idx_user_activities_campaign_id ON user_activities(campaign_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activities_created_at') THEN
        CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activities_activity_type') THEN
        CREATE INDEX idx_user_activities_activity_type ON user_activities(activity_type);
    END IF;

    -- Campaign Metrics indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campaign_metrics_campaign_id') THEN
        CREATE INDEX idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campaign_metrics_date') THEN
        CREATE INDEX idx_campaign_metrics_date ON campaign_metrics(date DESC);
    END IF;

    -- User Ad Frequency indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_ad_frequency_user_id') THEN
        CREATE INDEX idx_user_ad_frequency_user_id ON user_ad_frequency(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_ad_frequency_campaign_id') THEN
        CREATE INDEX idx_user_ad_frequency_campaign_id ON user_ad_frequency(campaign_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_ad_frequency_date') THEN
        CREATE INDEX idx_user_ad_frequency_date ON user_ad_frequency(date DESC);
    END IF;
END $$;

-- =============================================================================
-- DATABASE FUNCTIONS
-- =============================================================================

-- Function to record user activity and update metrics
CREATE OR REPLACE FUNCTION record_user_activity(
    p_user_id UUID,
    p_campaign_id UUID,
    p_activity_type ad_activity_type,
    p_reward_amount DECIMAL(10,2) DEFAULT 0.00,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Insert user activity
    INSERT INTO user_activities (user_id, campaign_id, activity_type, reward_amount, metadata)
    VALUES (p_user_id, p_campaign_id, p_activity_type, p_reward_amount, p_metadata)
    RETURNING id INTO activity_id;
    
    -- Update campaign metrics
    INSERT INTO campaign_metrics (campaign_id, date)
    VALUES (p_campaign_id, current_date)
    ON CONFLICT (campaign_id, date) DO NOTHING;
    
    -- Update specific metric based on activity type
    CASE p_activity_type
        WHEN 'view' THEN
            UPDATE campaign_metrics 
            SET total_views = total_views + 1, updated_at = NOW()
            WHERE campaign_id = p_campaign_id AND date = current_date;
        WHEN 'click' THEN
            UPDATE campaign_metrics 
            SET total_clicks = total_clicks + 1, updated_at = NOW()
            WHERE campaign_id = p_campaign_id AND date = current_date;
        WHEN 'complete' THEN
            UPDATE campaign_metrics 
            SET total_completions = total_completions + 1, updated_at = NOW()
            WHERE campaign_id = p_campaign_id AND date = current_date;
        WHEN 'share' THEN
            UPDATE campaign_metrics 
            SET total_shares = total_shares + 1, updated_at = NOW()
            WHERE campaign_id = p_campaign_id AND date = current_date;
        WHEN 'like' THEN
            UPDATE campaign_metrics 
            SET total_likes = total_likes + 1, updated_at = NOW()
            WHERE campaign_id = p_campaign_id AND date = current_date;
    END CASE;
    
    -- Update total earned and user balance if there's a reward
    IF p_reward_amount > 0 THEN
        UPDATE campaign_metrics 
        SET total_earned = total_earned + p_reward_amount, updated_at = NOW()
        WHERE campaign_id = p_campaign_id AND date = current_date;
        
        UPDATE users 
        SET balance = balance + p_reward_amount, updated_at = NOW()
        WHERE id = p_user_id;
        
        INSERT INTO transactions (user_id, type, amount, description, status, reference)
        VALUES (p_user_id, 'earning', p_reward_amount, 
                CONCAT('Ad reward for ', p_activity_type, ' activity'), 'completed',
                CONCAT('ad_', activity_id));
    END IF;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check frequency cap
CREATE OR REPLACE FUNCTION can_show_ad(
    p_user_id UUID,
    p_campaign_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    campaign_frequency_cap INTEGER;
    user_view_count INTEGER;
    current_date DATE := CURRENT_DATE;
BEGIN
    SELECT frequency_cap INTO campaign_frequency_cap
    FROM ad_campaigns
    WHERE id = p_campaign_id AND status = 'active';
    
    IF campaign_frequency_cap IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT view_count INTO user_view_count
    FROM user_ad_frequency
    WHERE user_id = p_user_id AND campaign_id = p_campaign_id AND date = current_date;
    
    IF user_view_count IS NULL THEN
        RETURN TRUE;
    END IF;
    
    RETURN user_view_count < campaign_frequency_cap;
END;
$$ LANGUAGE plpgsql;

-- Function to update ad frequency tracking
CREATE OR REPLACE FUNCTION update_ad_frequency(
    p_user_id UUID,
    p_campaign_id UUID
) RETURNS VOID AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
BEGIN
    INSERT INTO user_ad_frequency (user_id, campaign_id, date, view_count, last_shown_at)
    VALUES (p_user_id, p_campaign_id, current_date, 1, NOW())
    ON CONFLICT (user_id, campaign_id, date)
    DO UPDATE SET 
        view_count = user_ad_frequency.view_count + 1,
        last_shown_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ad_frequency ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop and recreate to avoid conflicts)
DO $$
BEGIN
    -- Ad Campaigns policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view active ad campaigns" ON ad_campaigns;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can view active ad campaigns" ON ad_campaigns
        FOR SELECT USING (status = 'active');

    BEGIN
        DROP POLICY IF EXISTS "Advertisers can manage own campaigns" ON ad_campaigns;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Advertisers can manage own campaigns" ON ad_campaigns
        FOR ALL USING (advertiser_id = auth.uid());

    -- User Activities policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can view their own activities" ON user_activities
        FOR SELECT USING (user_id = auth.uid());

    BEGIN
        DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activities;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can insert their own activities" ON user_activities
        FOR INSERT WITH CHECK (user_id = auth.uid());

    -- Campaign Metrics policies
    BEGIN
        DROP POLICY IF EXISTS "Everyone can view campaign metrics" ON campaign_metrics;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Everyone can view campaign metrics" ON campaign_metrics
        FOR SELECT USING (true);

    -- User Ad Frequency policies
    BEGIN
        DROP POLICY IF EXISTS "Users can view own ad frequency" ON user_ad_frequency;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "Users can view own ad frequency" ON user_ad_frequency
        FOR SELECT USING (user_id = auth.uid());

    BEGIN
        DROP POLICY IF EXISTS "System can manage ad frequency" ON user_ad_frequency;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy doesn't exist
    END;
    CREATE POLICY "System can manage ad frequency" ON user_ad_frequency
        FOR ALL USING (true);
END $$;

-- =============================================================================
-- SAMPLE DATA
-- =============================================================================

-- Insert sample campaigns (only if no campaigns exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ad_campaigns) AND EXISTS (SELECT 1 FROM users WHERE role IN ('admin', 'superadmin')) THEN
        INSERT INTO ad_campaigns (
            advertiser_id, 
            title, 
            description, 
            content,
            campaign_type,
            budget, 
            cost_per_action,
            daily_budget,
            frequency_cap,
            status
        ) 
        SELECT 
            id, 
            'EarnPro Mobile App Promotion', 
            'Promote our mobile app for better user engagement',
            '{"imageUrl": "/images/app-promo.jpg", "ctaText": "Download Now", "targetUrl": "https://earnpro.org/app"}',
            'display',
            5000.00, 
            0.50,
            100.00,
            3,
            'active'
        FROM users 
        WHERE role IN ('admin', 'superadmin')
        LIMIT 1;

        INSERT INTO ad_campaigns (
            advertiser_id, 
            title, 
            description, 
            content,
            campaign_type,
            budget, 
            cost_per_action,
            daily_budget,
            frequency_cap,
            status
        ) 
        SELECT 
            id, 
            'Video Tutorial Series', 
            'Educational videos about maximizing earnings',
            '{"videoUrl": "/videos/tutorial-intro.mp4", "duration": 120, "ctaText": "Watch Full Series"}',
            'video',
            3000.00, 
            1.00,
            75.00,
            2,
            'active'
        FROM users 
        WHERE role IN ('admin', 'superadmin')
        LIMIT 1;
    END IF;
END $$;

-- Final success message
SELECT 'Advertising platform migration completed successfully!' as message;
SELECT COUNT(*) as campaigns_count FROM ad_campaigns;
SELECT 'Setup complete - advertising platform is ready!' as status;
