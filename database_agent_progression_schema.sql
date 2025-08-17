-- ================================================================
-- AGENT PROGRESSION SYSTEM DATABASE SCHEMA
-- ================================================================
-- This schema supports the complete agent tier progression system
-- with dual commission structure and challenge tracking

-- ================================================================
-- 1. AGENT TIERS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS agent_tiers (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(20) NOT NULL UNIQUE, -- rookie, bronze, iron, steel, silver, gold, platinum, diamond
    display_name VARCHAR(50) NOT NULL,
    referral_requirement INTEGER NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL, -- e.g., 5.00 for 5%
    withdrawal_frequency INTEGER NOT NULL DEFAULT 1, -- times per week
    challenge_duration_days INTEGER, -- NULL for week1-3, set for silver+
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default agent tiers with hybrid referral counting system and progressive reset logic
-- Rookie: Direct referrals only with full restart from 0 on retry (proves basic potential)
-- Bronze-Steel: Direct referrals only with progressive reset system
-- Advanced tiers: Direct + Level 1 indirect referrals with base reset system
INSERT INTO agent_tiers (tier_name, display_name, referral_requirement, commission_rate, withdrawal_frequency, challenge_duration_days, description) VALUES
('rookie', 'Rookie Agent', 50, 5.00, 1, 7, 'Entry level: 50 direct referrals in 7 days (1 retry from 0 with 10 days)'),
('bronze', 'Bronze Agent', 100, 7.00, 1, 7, 'Progressive: 100 direct referrals in 7 days (2 resets from half)'),
('iron', 'Iron Agent', 200, 10.00, 2, 7, 'Advanced: 200 direct referrals in 7 days (2 resets from half)'),
('steel', 'Steel Agent', 400, 15.00, 2, 7, 'Expert: 400 direct referrals in 7 days (2 resets from half, 10 days for resets)'),
('silver', 'Silver Agent', 1000, 20.00, 2, 30, 'Silver: 1,000 network (direct + level 1) in 30 days'),
('gold', 'Gold Agent', 5000, 25.00, 3, 90, 'Gold: 5,000 network (direct + level 1) in 90 days'),
('platinum', 'Platinum Agent', 10000, 30.00, 3, 150, 'Platinum: 10,000 network (direct + level 1) in 150 days'),
('diamond', 'Diamond Agent', 25000, 35.00, 4, 300, 'Diamond: 25,000 network (direct + level 1) in 300 days');

-- ================================================================
-- 2. AGENT PROFILES TABLE (Enhanced)
-- ================================================================
CREATE TABLE IF NOT EXISTS agent_profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_tier VARCHAR(20) NOT NULL DEFAULT 'rookie' REFERENCES agent_tiers(tier_name),
    total_direct_referrals INTEGER NOT NULL DEFAULT 0,
    total_level1_indirect_referrals INTEGER NOT NULL DEFAULT 0, -- Level 1 indirect (referrals of direct referrals)
    total_network_size INTEGER GENERATED ALWAYS AS (total_direct_referrals + total_level1_indirect_referrals) STORED,
    current_challenge_tier VARCHAR(20) REFERENCES agent_tiers(tier_name), -- The tier they're challenging for
    challenge_start_date TIMESTAMP WITH TIME ZONE,
    challenge_end_date TIMESTAMP WITH TIME ZONE,
    challenge_direct_referrals INTEGER DEFAULT 0, -- Direct referrals gained during current challenge
    challenge_level1_referrals INTEGER DEFAULT 0, -- Level 1 indirect gained during current challenge  
    challenge_total_network INTEGER GENERATED ALWAYS AS (challenge_direct_referrals + challenge_level1_referrals) STORED,
    challenge_attempts INTEGER NOT NULL DEFAULT 0, -- Track current challenge attempt (0=original, 1-2=resets for first 4 tiers, 1-3=retries for advanced)
    challenge_starting_referrals INTEGER DEFAULT 0, -- Starting referrals for current challenge (for reset logic)
    challenge_max_referrals_reached INTEGER DEFAULT 0, -- Maximum referrals reached in failed attempt (for advanced tier reset calculation)
    challenge_cumulative_referrals INTEGER DEFAULT 0, -- CUMULATIVE VALIDATION: Total referrals earned across ALL attempts for current challenge
    challenge_cooldown_end TIMESTAMP WITH TIME ZONE, -- When cooldown period expires after final opportunity failure
    can_retry_challenge BOOLEAN NOT NULL DEFAULT TRUE, -- Whether agent can start new challenge (FALSE during cooldown)
    last_tier_achieved_date TIMESTAMP WITH TIME ZONE,
    is_challenge_active BOOLEAN NOT NULL DEFAULT FALSE,
    weekly_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_commission_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive, suspended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ================================================================
-- 3. AGENT CHALLENGE HISTORY TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS agent_challenge_history (
    id SERIAL PRIMARY KEY,
    agent_profile_id INTEGER NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
    target_tier VARCHAR(20) NOT NULL REFERENCES agent_tiers(tier_name),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    starting_referrals INTEGER NOT NULL,
    ending_referrals INTEGER NOT NULL,
    target_referrals INTEGER NOT NULL,
    challenge_result VARCHAR(20) NOT NULL, -- 'success', 'failed', 'in_progress'
    attempt_number INTEGER NOT NULL, -- 0=original attempt, 1-2=resets(first 4 tiers), 1-3=retries(advanced tiers)
    starting_referrals INTEGER NOT NULL, -- Starting point for this attempt (0 for original, calculated for resets)
    max_referrals_reached INTEGER DEFAULT 0, -- Maximum referrals reached during this attempt
    reset_date TIMESTAMP WITH TIME ZONE, -- When referrals were reset after failure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 4. AGENT COMMISSION TRANSACTIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS agent_commission_transactions (
    id SERIAL PRIMARY KEY,
    agent_profile_id INTEGER NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL, -- 'weekly_bonus', 'withdrawal_commission'
    base_amount DECIMAL(10,2) NOT NULL, -- Amount before commission
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL, -- Calculated commission
    tier_at_time VARCHAR(20) NOT NULL,
    week_number INTEGER, -- For weekly bonuses
    withdrawal_request_id UUID, -- Link to withdrawal if applicable
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, paid, rejected
    admin_approved_by UUID REFERENCES users(id),
    admin_approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 5. WITHDRAWAL REQUESTS TABLE (Enhanced)
-- ================================================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL,
    payment_details JSONB, -- Bank details, PayPal email, etc.
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, processing, completed, rejected
    admin_notes TEXT,
    user_notes TEXT,
    
    -- Agent-specific fields
    is_agent_withdrawal BOOLEAN NOT NULL DEFAULT FALSE,
    agent_tier VARCHAR(20) REFERENCES agent_tiers(tier_name),
    commission_rate DECIMAL(5,2), -- Rate applied at withdrawal time
    commission_amount DECIMAL(10,2), -- Commission added at withdrawal
    total_amount_with_commission DECIMAL(10,2), -- Final amount including commission
    weekly_withdrawal_count INTEGER DEFAULT 0, -- Track withdrawals per week
    
    -- Admin approval
    admin_approved_by UUID REFERENCES users(id),
    admin_approved_at TIMESTAMP WITH TIME ZONE,
    admin_rejected_by UUID REFERENCES users(id),
    admin_rejected_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 6. AGENT WEEKLY PERFORMANCE TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS agent_weekly_performance (
    id SERIAL PRIMARY KEY,
    agent_profile_id INTEGER NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- All earnings for the week
    referral_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    task_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ad_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    new_referrals INTEGER NOT NULL DEFAULT 0,
    total_referrals_at_week_end INTEGER NOT NULL DEFAULT 0,
    tier_at_week_start VARCHAR(20) NOT NULL,
    tier_at_week_end VARCHAR(20) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agent_profile_id, week_start_date)
);

-- ================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_current_tier ON agent_profiles(current_tier);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_challenge_active ON agent_profiles(is_challenge_active);
CREATE INDEX IF NOT EXISTS idx_agent_challenge_history_agent_id ON agent_challenge_history(agent_profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_commission_transactions_agent_id ON agent_commission_transactions(agent_profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_commission_transactions_status ON agent_commission_transactions(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_agent ON withdrawal_requests(is_agent_withdrawal);
CREATE INDEX IF NOT EXISTS idx_agent_weekly_performance_agent_id ON agent_weekly_performance(agent_profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_weekly_performance_week ON agent_weekly_performance(week_start_date);

-- ================================================================
-- 8. TRIGGERS FOR AUTOMATIC UPDATES
-- ================================================================

-- Trigger to update agent_profiles.updated_at
CREATE OR REPLACE FUNCTION update_agent_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_profiles_updated_at
    BEFORE UPDATE ON agent_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_profiles_updated_at();

-- Trigger to update withdrawal_requests.updated_at
CREATE OR REPLACE FUNCTION update_withdrawal_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_withdrawal_requests_updated_at
    BEFORE UPDATE ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_withdrawal_requests_updated_at();

-- ================================================================
-- 9. AGENT APPLICATION APPROVAL INTEGRATION
-- ================================================================

-- Function to approve agent application and create agent profile
CREATE OR REPLACE FUNCTION approve_agent_application(
    p_application_id UUID,
    p_reviewed_by UUID,
    p_feedback TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    agent_profile_id INTEGER,
    rookie_challenge_deadline TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_application RECORD;
    v_user_record RECORD;
    v_agent_exists BOOLEAN;
    v_new_agent_id INTEGER;
    v_rookie_duration INTEGER;
    v_challenge_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get application details
    SELECT * INTO v_application 
    FROM agent_applications 
    WHERE id = p_application_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE, 
            '❌ Application not found or already processed'::TEXT,
            NULL::INTEGER,
            NULL::TIMESTAMP WITH TIME ZONE;
        RETURN;
    END IF;
    
    -- Get user details
    SELECT * INTO v_user_record FROM users WHERE id = v_application.user_id;
    
    -- Check if user already has agent profile
    SELECT EXISTS(SELECT 1 FROM agent_profiles WHERE user_id = v_application.user_id) INTO v_agent_exists;
    
    IF v_agent_exists THEN
        RETURN QUERY SELECT 
            FALSE, 
            '❌ User already has an agent profile'::TEXT,
            NULL::INTEGER,
            NULL::TIMESTAMP WITH TIME ZONE;
        RETURN;
    END IF;
    
    -- Get rookie challenge duration
    SELECT challenge_duration_days INTO v_rookie_duration 
    FROM agent_tiers WHERE tier_name = 'rookie';
    v_challenge_end := NOW() + (v_rookie_duration || ' days')::INTERVAL;
    
    -- Update application status
    UPDATE agent_applications 
    SET 
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = p_reviewed_by,
        feedback = COALESCE(p_feedback, 'Application approved - Welcome to the Agent Program!')
    WHERE id = p_application_id;
    
    -- Create agent profile with rookie challenge
    INSERT INTO agent_profiles (
        user_id,
        current_tier,
        current_challenge_tier,
        total_direct_referrals,
        total_level1_indirect_referrals,
        challenge_direct_referrals,
        challenge_level1_referrals,
        challenge_attempts,
        challenge_starting_referrals,
        challenge_max_referrals_reached,
        challenge_cumulative_referrals,
        challenge_start_date,
        challenge_end_date,
        is_challenge_active,
        can_retry_challenge,
        weekly_earnings,
        total_commission_earned,
        status
    ) VALUES (
        v_application.user_id,
        'rookie',                    -- Start as rookie
        'rookie',                    -- Challenge rookie tier immediately
        0,                          -- No referrals yet
        0,                          -- No indirect referrals yet
        0,                          -- Challenge starts at 0
        0,                          -- Challenge starts at 0
        0,                          -- First attempt (original)
        0,                          -- Starting from 0
        0,                          -- No max reached yet
        0,                          -- No cumulative yet
        NOW(),                      -- Challenge starts now
        v_challenge_end,            -- 7 days to complete rookie
        TRUE,                       -- Challenge is active
        TRUE,                       -- Can retry if failed
        0.00,                       -- No earnings yet
        0.00,                       -- No commission yet
        'active'                    -- Active status
    ) RETURNING id INTO v_new_agent_id;
    
    -- Create initial challenge history record
    INSERT INTO agent_challenge_history (
        agent_profile_id,
        target_tier,
        start_date,
        end_date,
        starting_referrals,
        ending_referrals,
        target_referrals,
        challenge_result,
        attempt_number,
        max_referrals_reached
    ) VALUES (
        v_new_agent_id,
        'rookie',
        NOW(),
        v_challenge_end,
        0,
        0,
        50,
        'in_progress',
        0,
        0
    );
    
    RETURN QUERY SELECT 
        TRUE,
        FORMAT('🎉 Agent application approved! %s %s is now a Rookie Agent with 7 days to earn 50 referrals. Welcome to the Agent Program!', 
               v_user_record.first_name, v_user_record.last_name)::TEXT,
        v_new_agent_id,
        v_challenge_end;
END;
$$ LANGUAGE plpgsql;

-- Function to reject agent application
CREATE OR REPLACE FUNCTION reject_agent_application(
    p_application_id UUID,
    p_reviewed_by UUID,
    p_feedback TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_application RECORD;
    v_user_record RECORD;
BEGIN
    -- Get application details
    SELECT * INTO v_application 
    FROM agent_applications 
    WHERE id = p_application_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE, 
            '❌ Application not found or already processed'::TEXT;
        RETURN;
    END IF;
    
    -- Get user details for message
    SELECT * INTO v_user_record FROM users WHERE id = v_application.user_id;
    
    -- Update application status
    UPDATE agent_applications 
    SET 
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = p_reviewed_by,
        feedback = p_feedback
    WHERE id = p_application_id;
    
    RETURN QUERY SELECT 
        TRUE,
        FORMAT('Application for %s %s has been rejected. Feedback provided to applicant.', 
               v_user_record.first_name, v_user_record.last_name)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can access agent portal
CREATE OR REPLACE FUNCTION can_access_agent_portal(p_user_id UUID)
RETURNS TABLE (
    has_access BOOLEAN,
    status_reason VARCHAR(50),
    agent_tier VARCHAR(20),
    application_status VARCHAR(20)
) AS $$
DECLARE
    v_agent_profile agent_profiles%ROWTYPE;
    v_application_status VARCHAR(20);
BEGIN
    -- Check if user has agent profile
    SELECT * INTO v_agent_profile FROM agent_profiles WHERE user_id = p_user_id;
    
    IF FOUND AND v_agent_profile.status = 'active' THEN
        -- User is approved agent with access
        RETURN QUERY SELECT 
            TRUE, 
            'approved_agent'::VARCHAR(50),
            v_agent_profile.current_tier,
            'approved'::VARCHAR(20);
        RETURN;
    END IF;
    
    -- Check application status
    SELECT aa.status INTO v_application_status 
    FROM agent_applications aa 
    WHERE aa.user_id = p_user_id 
    ORDER BY aa.submitted_at DESC 
    LIMIT 1;
    
    IF v_application_status = 'pending' THEN
        RETURN QUERY SELECT 
            FALSE, 
            'application_pending'::VARCHAR(50),
            NULL::VARCHAR(20),
            'pending'::VARCHAR(20);
    ELSIF v_application_status = 'rejected' THEN
        RETURN QUERY SELECT 
            FALSE, 
            'application_rejected'::VARCHAR(50),
            NULL::VARCHAR(20),
            'rejected'::VARCHAR(20);
    ELSE
        -- No application found
        RETURN QUERY SELECT 
            FALSE, 
            'no_application'::VARCHAR(50),
            NULL::VARCHAR(20),
            NULL::VARCHAR(20);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get agent application statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_agent_application_stats()
RETURNS TABLE (
    pending_count INTEGER,
    approved_count INTEGER,
    rejected_count INTEGER,
    total_applications INTEGER,
    active_agents INTEGER,
    recent_applications JSONB
) AS $$
DECLARE
    v_pending INTEGER;
    v_approved INTEGER;
    v_rejected INTEGER;
    v_total INTEGER;
    v_active_agents INTEGER;
    v_recent JSONB;
BEGIN
    -- Count applications by status
    SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END),
        COUNT(CASE WHEN status = 'approved' THEN 1 END),
        COUNT(CASE WHEN status = 'rejected' THEN 1 END),
        COUNT(*)
    INTO v_pending, v_approved, v_rejected, v_total
    FROM agent_applications;
    
    -- Count active agents
    SELECT COUNT(*) INTO v_active_agents 
    FROM agent_profiles 
    WHERE status = 'active';
    
    -- Get recent applications (last 5)
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', aa.id,
            'user_name', u.first_name || ' ' || u.last_name,
            'user_email', u.email,
            'status', aa.status,
            'submitted_at', aa.submitted_at,
            'social_media_links', aa.social_media_links
        )
    ) INTO v_recent
    FROM agent_applications aa
    JOIN users u ON aa.user_id = u.id
    ORDER BY aa.submitted_at DESC
    LIMIT 5;
    
    RETURN QUERY SELECT 
        v_pending,
        v_approved,
        v_rejected,
        v_total,
        v_active_agents,
        COALESCE(v_recent, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Function to get pending applications for admin review
CREATE OR REPLACE FUNCTION get_pending_agent_applications()
RETURNS TABLE (
    application_id UUID,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    experience TEXT,
    motivation TEXT,
    social_media_links TEXT[],
    portfolio_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    days_pending INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.id,
        aa.user_id,
        u.first_name || ' ' || u.last_name,
        u.email,
        aa.experience,
        aa.motivation,
        aa.social_media_links,
        aa.portfolio_url,
        aa.submitted_at,
        EXTRACT(DAY FROM NOW() - aa.submitted_at)::INTEGER
    FROM agent_applications aa
    JOIN users u ON aa.user_id = u.id
    WHERE aa.status = 'pending'
    ORDER BY aa.submitted_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is eligible to become an agent
CREATE OR REPLACE FUNCTION check_agent_eligibility(p_user_id UUID)
RETURNS TABLE (
    is_eligible BOOLEAN,
    reason VARCHAR(100),
    requirements_met JSONB
) AS $$
DECLARE
    v_user_record RECORD;
    v_agent_exists BOOLEAN;
    v_requirements JSONB;
BEGIN
    -- Check if user exists and get basic info
    SELECT u.*, ap.id as agent_id INTO v_user_record
    FROM users u
    LEFT JOIN agent_profiles ap ON u.id = ap.user_id
    WHERE u.id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'User not found'::VARCHAR(100), '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Check if already an agent
    IF v_user_record.agent_id IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, 'User is already an agent'::VARCHAR(100), '{}'::JSONB;
        RETURN;
    END IF;
    
    -- Build requirements check
    v_requirements := jsonb_build_object(
        'account_verified', COALESCE(v_user_record.email_verified, FALSE),
        'account_active', COALESCE(v_user_record.status = 'active', FALSE),
        'minimum_age_days', COALESCE(EXTRACT(DAY FROM NOW() - v_user_record.created_at) >= 7, FALSE),
        'profile_complete', COALESCE(v_user_record.first_name IS NOT NULL AND v_user_record.last_name IS NOT NULL, FALSE)
    );
    
    -- Check if all requirements are met
    IF (v_requirements->>'account_verified')::BOOLEAN 
       AND (v_requirements->>'account_active')::BOOLEAN 
       AND (v_requirements->>'minimum_age_days')::BOOLEAN 
       AND (v_requirements->>'profile_complete')::BOOLEAN THEN
        RETURN QUERY SELECT TRUE, 'All requirements met'::VARCHAR(100), v_requirements;
    ELSE
        RETURN QUERY SELECT FALSE, 'Requirements not met'::VARCHAR(100), v_requirements;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to enroll a user as an agent
CREATE OR REPLACE FUNCTION enroll_user_as_agent(p_user_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    agent_profile_id INTEGER,
    rookie_challenge_end_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_eligibility RECORD;
    v_new_agent_id INTEGER;
    v_rookie_duration INTEGER;
    v_challenge_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check eligibility first
    SELECT * INTO v_eligibility FROM check_agent_eligibility(p_user_id);
    
    IF NOT v_eligibility.is_eligible THEN
        RETURN QUERY SELECT 
            FALSE, 
            FORMAT('❌ Enrollment failed: %s. Requirements: %s', v_eligibility.reason, v_eligibility.requirements_met::TEXT)::TEXT,
            NULL::INTEGER,
            NULL::TIMESTAMP WITH TIME ZONE;
        RETURN;
    END IF;
    
    -- Get rookie challenge duration
    SELECT challenge_duration_days INTO v_rookie_duration FROM agent_tiers WHERE tier_name = 'rookie';
    v_challenge_end := NOW() + (v_rookie_duration || ' days')::INTERVAL;
    
    -- Create agent profile
    INSERT INTO agent_profiles (
        user_id,
        current_tier,
        current_challenge_tier,
        total_direct_referrals,
        total_level1_indirect_referrals,
        challenge_direct_referrals,
        challenge_level1_referrals,
        challenge_attempts,
        challenge_starting_referrals,
        challenge_max_referrals_reached,
        challenge_cumulative_referrals,
        challenge_start_date,
        challenge_end_date,
        is_challenge_active,
        can_retry_challenge,
        weekly_earnings,
        total_commission_earned,
        status
    ) VALUES (
        p_user_id,
        'rookie',                    -- Start as rookie
        'rookie',                    -- Challenge rookie tier immediately
        0,                          -- No referrals yet
        0,                          -- No indirect referrals yet
        0,                          -- Challenge starts at 0
        0,                          -- Challenge starts at 0
        0,                          -- First attempt
        0,                          -- Starting from 0
        0,                          -- No max reached yet
        0,                          -- No cumulative yet
        NOW(),                      -- Challenge starts now
        v_challenge_end,            -- 7 days to complete rookie
        TRUE,                       -- Challenge is active
        TRUE,                       -- Can retry if needed
        0.00,                       -- No earnings yet
        0.00,                       -- No commission yet
        'active'                    -- Active status
    ) RETURNING id INTO v_new_agent_id;
    
    -- Create initial challenge history record
    INSERT INTO agent_challenge_history (
        agent_profile_id,
        target_tier,
        start_date,
        end_date,
        starting_referrals,
        ending_referrals,
        target_referrals,
        challenge_result,
        attempt_number,
        max_referrals_reached
    ) VALUES (
        v_new_agent_id,
        'rookie',
        NOW(),
        v_challenge_end,
        0,
        0,
        50,
        'in_progress',
        0,
        0
    );
    
    RETURN QUERY SELECT 
        TRUE,
        FORMAT('🎉 Welcome to the Agent Program! You are now a Rookie Agent. Complete 50 direct referrals in %s days to advance to Bronze tier and unlock 7%% commission rates!', v_rookie_duration)::TEXT,
        v_new_agent_id,
        v_challenge_end;
END;
$$ LANGUAGE plpgsql;

-- Function to get agent enrollment statistics
CREATE OR REPLACE FUNCTION get_agent_enrollment_stats()
RETURNS TABLE (
    total_agents INTEGER,
    new_agents_this_month INTEGER,
    agents_by_tier JSONB,
    success_rate_percent DECIMAL(5,2)
) AS $$
DECLARE
    v_total_agents INTEGER;
    v_new_this_month INTEGER;
    v_tier_distribution JSONB;
    v_success_rate DECIMAL(5,2);
BEGIN
    -- Total agents
    SELECT COUNT(*) INTO v_total_agents FROM agent_profiles WHERE status = 'active';
    
    -- New agents this month
    SELECT COUNT(*) INTO v_new_this_month 
    FROM agent_profiles 
    WHERE status = 'active' 
    AND created_at >= DATE_TRUNC('month', NOW());
    
    -- Agents by tier distribution
    SELECT jsonb_object_agg(current_tier, agent_count)
    INTO v_tier_distribution
    FROM (
        SELECT current_tier, COUNT(*) as agent_count
        FROM agent_profiles 
        WHERE status = 'active'
        GROUP BY current_tier
        ORDER BY 
            CASE current_tier
                WHEN 'rookie' THEN 1
                WHEN 'bronze' THEN 2
                WHEN 'iron' THEN 3
                WHEN 'steel' THEN 4
                WHEN 'silver' THEN 5
                WHEN 'gold' THEN 6
                WHEN 'platinum' THEN 7
                WHEN 'diamond' THEN 8
                ELSE 9
            END
    ) tier_stats;
    
    -- Success rate (agents who progressed beyond rookie)
    SELECT 
        CASE WHEN v_total_agents > 0 
        THEN (COUNT(*) FILTER (WHERE current_tier != 'rookie') * 100.0 / v_total_agents)
        ELSE 0 
        END
    INTO v_success_rate
    FROM agent_profiles 
    WHERE status = 'active';
    
    RETURN QUERY SELECT 
        v_total_agents,
        v_new_this_month,
        v_tier_distribution,
        v_success_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can become agent (for UI display)
CREATE OR REPLACE FUNCTION can_user_become_agent(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_eligibility RECORD;
BEGIN
    SELECT * INTO v_eligibility FROM check_agent_eligibility(p_user_id);
    RETURN v_eligibility.is_eligible;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 10. FUNCTIONS FOR AGENT TIER MANAGEMENT
-- ================================================================

-- Function to get agent's current tier information
CREATE OR REPLACE FUNCTION get_agent_tier_info(p_user_id UUID)
RETURNS TABLE (
    tier_name VARCHAR(20),
    display_name VARCHAR(50),
    commission_rate DECIMAL(5,2),
    withdrawal_frequency INTEGER,
    total_direct_referrals INTEGER,
    next_tier_requirement INTEGER,
    challenge_active BOOLEAN,
    challenge_end_date TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        at.tier_name,
        at.display_name,
        at.commission_rate,
        at.withdrawal_frequency,
        ap.total_direct_referrals,
        COALESCE(next_tier.referral_requirement, 0) as next_tier_requirement,
        ap.is_challenge_active,
        ap.challenge_end_date,
        CASE 
            WHEN ap.challenge_end_date IS NOT NULL 
            THEN EXTRACT(DAY FROM ap.challenge_end_date - NOW())::INTEGER
            ELSE 0
        END as days_remaining
    FROM agent_profiles ap
    JOIN agent_tiers at ON ap.current_tier = at.tier_name
    LEFT JOIN agent_tiers next_tier ON next_tier.tier_name = ap.current_challenge_tier
    WHERE ap.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update agent tier progression
CREATE OR REPLACE FUNCTION check_agent_progression(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_agent_profile agent_profiles%ROWTYPE;
    v_current_tier agent_tiers%ROWTYPE;
    v_next_tier agent_tiers%ROWTYPE;
    v_should_progress BOOLEAN := FALSE;
BEGIN
    -- Get agent profile
    SELECT * INTO v_agent_profile 
    FROM agent_profiles 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get current tier info
    SELECT * INTO v_current_tier 
    FROM agent_tiers 
    WHERE tier_name = v_agent_profile.current_tier;
    
    -- Check if agent meets next tier requirements
    SELECT * INTO v_next_tier 
    FROM agent_tiers 
    WHERE referral_requirement > v_current_tier.referral_requirement
    AND v_agent_profile.total_direct_referrals >= referral_requirement
    ORDER BY referral_requirement ASC 
    LIMIT 1;
    
    IF FOUND THEN
        -- Update agent tier
        UPDATE agent_profiles 
        SET 
            current_tier = v_next_tier.tier_name,
            last_tier_achieved_date = NOW(),
            is_challenge_active = CASE 
                WHEN v_next_tier.challenge_duration_days IS NOT NULL 
                THEN TRUE 
                ELSE FALSE 
            END,
            current_challenge_tier = CASE
                WHEN v_next_tier.tier_name != 'diamond' THEN (
                    SELECT tier_name FROM agent_tiers 
                    WHERE referral_requirement > v_next_tier.referral_requirement 
                    ORDER BY referral_requirement ASC 
                    LIMIT 1
                )
                ELSE NULL
            END,
            challenge_start_date = CASE 
                WHEN v_next_tier.challenge_duration_days IS NOT NULL 
                THEN NOW() 
                ELSE NULL 
            END,
            challenge_end_date = CASE 
                WHEN v_next_tier.challenge_duration_days IS NOT NULL 
                THEN NOW() + (v_next_tier.challenge_duration_days || ' days')::INTERVAL
                ELSE NULL 
            END,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        v_should_progress := TRUE;
    END IF;
    
    RETURN v_should_progress;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PROGRESSIVE RESET SYSTEM FUNCTIONS
-- ================================================================

-- Function to get reset starting point for a tier and attempt
CREATE OR REPLACE FUNCTION get_reset_starting_point(target_tier VARCHAR(20), attempt_number INTEGER, max_reached INTEGER)
RETURNS INTEGER AS $$
DECLARE
    tier_requirement INTEGER;
BEGIN
    SELECT referral_requirement INTO tier_requirement FROM agent_tiers WHERE tier_name = target_tier;
    
    -- Rookie tier: Always start from 0 (proves basic potential)
    IF target_tier = 'rookie' THEN
        RETURN 0;
    -- Bronze, Iron, Steel tiers: Progressive reset system
    ELSIF target_tier IN ('bronze', 'iron', 'steel') THEN
        -- Original attempt starts from 0
        IF attempt_number = 0 THEN
            RETURN 0;
        -- Reset attempts start from half the target
        ELSE
            RETURN tier_requirement / 2;
        END IF;
    -- Advanced tiers: Base reset system (start from half of max reached)
    ELSE
        -- Original attempt starts from 0
        IF attempt_number = 0 THEN
            RETURN 0;
        -- Retry attempts start from half of maximum reached in failed attempt
        ELSE
            RETURN GREATEST(0, max_reached / 2);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get challenge duration with special rules
CREATE OR REPLACE FUNCTION get_challenge_duration(target_tier VARCHAR(20), attempt_number INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Rookie tier gets 10 days for retry attempts (restart from 0)
    IF target_tier = 'rookie' AND attempt_number > 0 THEN
        RETURN 10;
    -- Steel tier gets 10 days for reset attempts
    ELSIF target_tier = 'steel' AND attempt_number > 0 THEN
        RETURN 10;
    -- All other tiers use their default duration
    ELSE
        RETURN (SELECT challenge_duration_days FROM agent_tiers WHERE tier_name = target_tier);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get cooldown period for a tier
CREATE OR REPLACE FUNCTION get_cooldown_period(target_tier VARCHAR(20))
RETURNS INTEGER AS $$
BEGIN
    -- Simplified cooldown periods - maximum 3 days
    CASE target_tier
        WHEN 'rookie' THEN RETURN 1;   -- 1 day for entry level
        WHEN 'bronze' THEN RETURN 2;   -- 2 days for bronze
        WHEN 'iron' THEN RETURN 2;     -- 2 days for iron
        WHEN 'steel' THEN RETURN 3;    -- 3 days for steel
        ELSE RETURN 3;                  -- 3 days for advanced tiers (silver+)
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if agent can start a new challenge (not in cooldown)
CREATE OR REPLACE FUNCTION can_start_challenge(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_agent_profile agent_profiles%ROWTYPE;
BEGIN
    SELECT * INTO v_agent_profile FROM agent_profiles WHERE user_id = p_user_id;
    
    -- Check if agent exists and is not in cooldown
    IF FOUND AND v_agent_profile.can_retry_challenge 
       AND (v_agent_profile.challenge_cooldown_end IS NULL OR v_agent_profile.challenge_cooldown_end <= NOW()) THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get maximum attempts allowed for a tier
CREATE OR REPLACE FUNCTION get_max_attempts(target_tier VARCHAR(20))
RETURNS INTEGER AS $$
BEGIN
    -- Rookie tier: Original + 1 retry from scratch = 2 total attempts
    IF target_tier = 'rookie' THEN
        RETURN 1; -- 1 retry attempt after original (from scratch with 10 days)
    -- Bronze, Iron, Steel tiers: Original + 2 resets = 3 total attempts
    ELSIF target_tier IN ('bronze', 'iron', 'steel') THEN
        RETURN 2; -- 2 reset attempts after original
    -- Advanced tiers: Original + 3 retries = 4 total attempts
    ELSE
        RETURN 3; -- 3 retry attempts after original
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get previous tier for demotion
CREATE OR REPLACE FUNCTION get_previous_tier(current_tier VARCHAR(20))
RETURNS VARCHAR(20) AS $$
BEGIN
    CASE current_tier
        WHEN 'bronze' THEN RETURN 'rookie';
        WHEN 'iron' THEN RETURN 'bronze';
        WHEN 'steel' THEN RETURN 'iron';
        WHEN 'silver' THEN RETURN 'steel';
        WHEN 'gold' THEN RETURN 'silver';
        WHEN 'platinum' THEN RETURN 'gold';
        WHEN 'diamond' THEN RETURN 'platinum';
        ELSE RETURN 'rookie'; -- Default fallback
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to reset challenge with progressive logic
CREATE OR REPLACE FUNCTION reset_agent_challenge(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_agent_profile agent_profiles%ROWTYPE;
    v_target_tier agent_tiers%ROWTYPE;
    v_max_attempts INTEGER;
    v_starting_point INTEGER;
    v_duration INTEGER;
    v_previous_tier VARCHAR(20);
BEGIN
    -- Get agent profile
    SELECT * INTO v_agent_profile FROM agent_profiles WHERE user_id = p_user_id;
    IF NOT FOUND THEN RETURN FALSE; END IF;
    
    -- Get target tier info
    SELECT * INTO v_target_tier FROM agent_tiers WHERE tier_name = v_agent_profile.current_challenge_tier;
    IF NOT FOUND THEN RETURN FALSE; END IF;
    
    -- Get maximum attempts for this tier
    v_max_attempts := get_max_attempts(v_agent_profile.current_challenge_tier);
    
    -- Check if agent has exceeded maximum attempts
    IF v_agent_profile.challenge_attempts >= v_max_attempts THEN
        -- Demote to previous tier challenge
        v_previous_tier := get_previous_tier(v_agent_profile.current_challenge_tier);
        
        UPDATE agent_profiles 
        SET 
            current_tier = v_previous_tier,
            current_challenge_tier = v_agent_profile.current_challenge_tier, -- Challenge for the tier they failed
            challenge_attempts = 0,
            challenge_starting_referrals = 0,
            challenge_max_referrals_reached = 0,
            challenge_direct_referrals = 0,
            challenge_level1_referrals = 0,
            challenge_start_date = NOW(),
            challenge_end_date = NOW() + (get_challenge_duration(v_agent_profile.current_challenge_tier, 0) || ' days')::INTERVAL,
            is_challenge_active = TRUE,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        RETURN TRUE; -- Demoted
    END IF;
    
    -- Calculate starting point for reset
    v_starting_point := get_reset_starting_point(
        v_agent_profile.current_challenge_tier,
        v_agent_profile.challenge_attempts + 1,
        v_agent_profile.challenge_max_referrals_reached
    );
    
    -- Get duration for reset attempt
    v_duration := get_challenge_duration(v_agent_profile.current_challenge_tier, v_agent_profile.challenge_attempts + 1);
    
    -- Reset challenge with new starting point
    UPDATE agent_profiles 
    SET 
        challenge_attempts = challenge_attempts + 1,
        challenge_starting_referrals = v_starting_point,
        challenge_direct_referrals = v_starting_point,
        challenge_level1_referrals = 0, -- Only reset level 1 for advanced tiers
        challenge_start_date = NOW(),
        challenge_end_date = NOW() + (v_duration || ' days')::INTERVAL,
        is_challenge_active = TRUE,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN FALSE; -- Reset (not demoted)
END;
$$ LANGUAGE plpgsql;

-- Function to complete successful challenge and auto-start next
CREATE OR REPLACE FUNCTION complete_agent_challenge(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_agent_profile agent_profiles%ROWTYPE;
    v_next_tier_name VARCHAR(20);
    v_next_tier agent_tiers%ROWTYPE;
BEGIN
    -- Get agent profile
    SELECT * INTO v_agent_profile FROM agent_profiles WHERE user_id = p_user_id;
    IF NOT FOUND THEN RETURN FALSE; END IF;
    
    -- Determine next tier
    CASE v_agent_profile.current_challenge_tier
        WHEN 'rookie' THEN v_next_tier_name := 'bronze';
        WHEN 'bronze' THEN v_next_tier_name := 'iron';
        WHEN 'iron' THEN v_next_tier_name := 'steel';
        WHEN 'steel' THEN v_next_tier_name := 'silver';
        WHEN 'silver' THEN v_next_tier_name := 'gold';
        WHEN 'gold' THEN v_next_tier_name := 'platinum';
        WHEN 'platinum' THEN v_next_tier_name := 'diamond';
        WHEN 'diamond' THEN v_next_tier_name := NULL; -- Max tier reached
        ELSE v_next_tier_name := NULL;
    END CASE;
    
    -- Update current tier to completed challenge tier
    UPDATE agent_profiles 
    SET 
        current_tier = current_challenge_tier,
        last_tier_achieved_date = NOW(),
        challenge_attempts = 0,
        challenge_starting_referrals = 0,
        challenge_max_referrals_reached = 0,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- If there's a next tier, auto-start the challenge
    IF v_next_tier_name IS NOT NULL THEN
        SELECT * INTO v_next_tier FROM agent_tiers WHERE tier_name = v_next_tier_name;
        
        UPDATE agent_profiles 
        SET 
            current_challenge_tier = v_next_tier_name,
            challenge_direct_referrals = 0,
            challenge_level1_referrals = 0,
            challenge_start_date = NOW(),
            challenge_end_date = NOW() + (v_next_tier.challenge_duration_days || ' days')::INTERVAL,
            is_challenge_active = TRUE,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        -- Diamond tier reached - no more challenges
        UPDATE agent_profiles 
        SET 
            current_challenge_tier = NULL,
            challenge_direct_referrals = 0,
            challenge_level1_referrals = 0,
            challenge_start_date = NULL,
            challenge_end_date = NULL,
            is_challenge_active = FALSE,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- CUMULATIVE VALIDATION SYSTEM FUNCTIONS
-- ================================================================

-- Function to check if agent meets cumulative referral requirement
CREATE OR REPLACE FUNCTION check_cumulative_validation(p_user_id UUID, target_tier VARCHAR(20))
RETURNS TABLE (
    meets_cumulative_requirement BOOLEAN,
    cumulative_referrals INTEGER,
    required_referrals INTEGER,
    deficit INTEGER,
    validation_status VARCHAR(50)
) AS $$
DECLARE
    v_agent_profile agent_profiles%ROWTYPE;
    v_tier_requirement INTEGER;
    v_current_count INTEGER;
    v_cumulative_count INTEGER;
    v_meets_requirement BOOLEAN;
BEGIN
    -- Get agent profile
    SELECT * INTO v_agent_profile FROM agent_profiles WHERE user_id = p_user_id;
    
    -- Get tier requirement
    SELECT referral_requirement INTO v_tier_requirement FROM agent_tiers WHERE tier_name = target_tier;
    
    -- Get current challenge count (for immediate completion check)
    IF target_tier IN ('rookie', 'bronze', 'iron', 'steel') THEN
        v_current_count := v_agent_profile.challenge_direct_referrals;
    ELSE
        v_current_count := v_agent_profile.challenge_total_network;
    END IF;
    
    -- Get cumulative count across all attempts
    v_cumulative_count := v_agent_profile.challenge_cumulative_referrals;
    
    -- Check if meets cumulative requirement
    v_meets_requirement := v_cumulative_count >= v_tier_requirement;
    
    RETURN QUERY SELECT 
        v_meets_requirement,
        v_cumulative_count,
        v_tier_requirement,
        GREATEST(0, v_tier_requirement - v_cumulative_count),
        CASE 
            WHEN v_current_count >= v_tier_requirement THEN 'IMMEDIATE_COMPLETION'
            WHEN v_meets_requirement THEN 'CUMULATIVE_SATISFIED'
            ELSE 'DEFICIT_REMAINING'
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to update cumulative referrals when new referrals are added
CREATE OR REPLACE FUNCTION update_cumulative_referrals(p_user_id UUID, new_referrals_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_agent_profile agent_profiles%ROWTYPE;
    v_previous_count INTEGER;
    v_new_earned INTEGER;
BEGIN
    -- Get current agent profile
    SELECT * INTO v_agent_profile FROM agent_profiles WHERE user_id = p_user_id;
    IF NOT FOUND THEN RETURN FALSE; END IF;
    
    -- Calculate new referrals earned (subtract starting point to get actual new referrals)
    v_previous_count := COALESCE(v_agent_profile.challenge_starting_referrals, 0);
    v_new_earned := GREATEST(0, new_referrals_count - v_previous_count);
    
    -- Update cumulative count
    UPDATE agent_profiles 
    SET challenge_cumulative_referrals = challenge_cumulative_referrals + v_new_earned
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enhanced completion function with cumulative validation
CREATE OR REPLACE FUNCTION complete_challenge_with_validation(p_user_id UUID)
RETURNS TABLE (
    completion_status VARCHAR(50),
    message TEXT,
    can_advance BOOLEAN,
    deficit_remaining INTEGER
) AS $$
DECLARE
    v_agent_profile agent_profiles%ROWTYPE;
    v_target_tier agent_tiers%ROWTYPE;
    v_validation_result RECORD;
    v_current_count INTEGER;
BEGIN
    -- Get agent profile
    SELECT * INTO v_agent_profile FROM agent_profiles WHERE user_id = p_user_id;
    IF NOT FOUND THEN 
        RETURN QUERY SELECT 'ERROR'::VARCHAR(50), 'Agent profile not found'::TEXT, FALSE, 0;
        RETURN;
    END IF;
    
    -- Get target tier
    SELECT * INTO v_target_tier FROM agent_tiers WHERE tier_name = v_agent_profile.current_challenge_tier;
    
    -- Get current challenge count
    IF v_agent_profile.current_challenge_tier IN ('rookie', 'bronze', 'iron', 'steel') THEN
        v_current_count := v_agent_profile.challenge_direct_referrals;
    ELSE
        v_current_count := v_agent_profile.challenge_total_network;
    END IF;
    
    -- Check cumulative validation
    SELECT * INTO v_validation_result 
    FROM check_cumulative_validation(p_user_id, v_agent_profile.current_challenge_tier);
    
    -- Scenario 1: Immediate completion (current count meets requirement)
    IF v_current_count >= v_target_tier.referral_requirement THEN
        -- Complete challenge and advance
        PERFORM complete_agent_challenge(p_user_id);
        RETURN QUERY SELECT 
            'IMMEDIATE_COMPLETION'::VARCHAR(50),
            'Challenge completed! Advancing to next tier.'::TEXT,
            TRUE,
            0;
        RETURN;
    END IF;
    
    -- Scenario 2: Current attempt failed, but cumulative requirement met
    IF v_validation_result.meets_cumulative_requirement THEN
        -- Complete challenge and advance (cumulative validation passed)
        PERFORM complete_agent_challenge(p_user_id);
        RETURN QUERY SELECT 
            'CUMULATIVE_COMPLETION'::VARCHAR(50),
            FORMAT('Challenge completed via cumulative validation! Total earned: %s/%s referrals across all attempts.', 
                   v_validation_result.cumulative_referrals, 
                   v_validation_result.required_referrals)::TEXT,
            TRUE,
            0;
        RETURN;
    END IF;
    
    -- Scenario 3: Still has deficit
    RETURN QUERY SELECT 
        'DEFICIT_REMAINING'::VARCHAR(50),
        FORMAT('Challenge incomplete. Total earned: %s/%s. You need %s more referrals across all attempts to qualify.', 
               v_validation_result.cumulative_referrals,
               v_validation_result.required_referrals,
               v_validation_result.deficit)::TEXT,
        FALSE,
        v_validation_result.deficit;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- ENHANCED HYBRID REFERRAL COUNTING SYSTEM FUNCTIONS
-- ================================================================

-- Function to offer final completion opportunity for deficit
CREATE OR REPLACE FUNCTION offer_deficit_completion_chance(p_user_id UUID)
RETURNS TABLE (
    opportunity_granted BOOLEAN,
    deficit_required INTEGER,
    time_limit_days INTEGER,
    message TEXT
) AS $$
DECLARE
    v_agent_profile agent_profiles%ROWTYPE;
    v_validation_result RECORD;
    v_target_tier agent_tiers%ROWTYPE;
    v_final_time_days INTEGER;
BEGIN
    -- Get agent profile
    SELECT * INTO v_agent_profile FROM agent_profiles WHERE user_id = p_user_id;
    
    -- Get validation result
    SELECT * INTO v_validation_result 
    FROM check_cumulative_validation(p_user_id, v_agent_profile.current_challenge_tier);
    
    -- Only offer if there's a deficit but agent made significant progress (70%+ completed)
    IF v_validation_result.deficit > 0 AND v_validation_result.deficit <= (v_validation_result.required_referrals * 0.3) THEN
        -- Get target tier
        SELECT * INTO v_target_tier FROM agent_tiers WHERE tier_name = v_agent_profile.current_challenge_tier;
        
        -- Calculate final opportunity time (OPTION C: Deficit-based time allocation)
        v_final_time_days := CASE 
            WHEN v_validation_result.deficit <= 10 THEN 3  -- Small deficit: 3 days
            WHEN v_validation_result.deficit <= 30 THEN 5  -- Medium deficit: 5 days  
            WHEN v_validation_result.deficit <= 50 THEN 7  -- Large deficit: 7 days
            ELSE 10 -- Very large deficit: 10 days (rare case)
        END;
        
        -- Grant final completion opportunity
        UPDATE agent_profiles 
        SET 
            challenge_attempts = 999, -- Special marker for deficit completion
            challenge_start_date = NOW(),
            challenge_end_date = NOW() + (v_final_time_days || ' days')::INTERVAL,
            challenge_direct_referrals = 0, -- Start fresh for deficit completion
            challenge_level1_referrals = 0,
            is_challenge_active = TRUE,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        RETURN QUERY SELECT 
            TRUE,
            v_validation_result.deficit,
            v_final_time_days,
            FORMAT('🎯 FINAL OPPORTUNITY! Earn %s more referrals in %s days to complete your %s challenge. Time allocated based on deficit size - this is your last chance before demotion.', 
                   v_validation_result.deficit,
                   v_final_time_days,
                   v_agent_profile.current_challenge_tier)::TEXT;
    ELSE
        -- No opportunity - demote immediately
        RETURN QUERY SELECT 
            FALSE,
            v_validation_result.deficit,
            0,
            CASE 
                WHEN v_validation_result.deficit > (v_validation_result.required_referrals * 0.3) 
                THEN FORMAT('Challenge failed - insufficient progress (%s/%s completed). Moving to previous tier.', 
                           v_validation_result.cumulative_referrals, v_validation_result.required_referrals)
                ELSE 'Challenge failed - maximum attempts exceeded. Moving to previous tier.'
            END::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to handle final opportunity completion or failure
CREATE OR REPLACE FUNCTION complete_final_opportunity(p_user_id UUID)
RETURNS TABLE (
    final_status VARCHAR(50),
    message TEXT,
    action_taken VARCHAR(50)
) AS $$
DECLARE
    v_agent_profile agent_profiles%ROWTYPE;
    v_validation_result RECORD;
    v_previous_tier VARCHAR(20);
BEGIN
    -- Get agent profile
    SELECT * INTO v_agent_profile FROM agent_profiles WHERE user_id = p_user_id;
    
    -- Check if this is a final opportunity attempt (challenge_attempts = 999)
    IF v_agent_profile.challenge_attempts != 999 THEN
        RETURN QUERY SELECT 'ERROR'::VARCHAR(50), 'Not a final opportunity attempt'::TEXT, 'NONE'::VARCHAR(50);
        RETURN;
    END IF;
    
    -- Get cumulative validation result
    SELECT * INTO v_validation_result 
    FROM check_cumulative_validation(p_user_id, v_agent_profile.current_challenge_tier);
    
    -- Check if they completed the deficit
    IF v_validation_result.meets_cumulative_requirement THEN
        -- SUCCESS: Complete challenge and advance
        PERFORM complete_agent_challenge(p_user_id);
        
        -- Reset cumulative referrals for next challenge
        UPDATE agent_profiles 
        SET challenge_cumulative_referrals = 0
        WHERE user_id = p_user_id;
        
        RETURN QUERY SELECT 
            'FINAL_SUCCESS'::VARCHAR(50),
            FORMAT('🎉 Final opportunity completed! Total earned: %s/%s referrals. Advancing to next tier!', 
                   v_validation_result.cumulative_referrals, v_validation_result.required_referrals)::TEXT,
            'TIER_ADVANCEMENT'::VARCHAR(50);
    ELSE
        -- FAILURE: Demote to previous tier
        v_previous_tier := get_previous_tier(v_agent_profile.current_challenge_tier);
        
        UPDATE agent_profiles 
        SET 
            current_tier = v_previous_tier,
            current_challenge_tier = v_agent_profile.current_challenge_tier, -- Still challenge the same tier
            challenge_attempts = 0,
            challenge_starting_referrals = 0,
            challenge_max_referrals_reached = 0,
            challenge_cumulative_referrals = 0, -- Reset cumulative tracking
            challenge_direct_referrals = 0,
            challenge_level1_referrals = 0,
            is_challenge_active = FALSE, -- Give them a break before next attempt
            can_retry_challenge = FALSE, -- Disable retry during cooldown
            challenge_cooldown_end = NOW() + (get_cooldown_period(v_agent_profile.current_challenge_tier) || ' days')::INTERVAL,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        RETURN QUERY SELECT 
            'FINAL_FAILURE'::VARCHAR(50),
            FORMAT('❌ Final opportunity failed. Total earned: %s/%s (deficit: %s). Demoted to %s tier. You can retry the %s challenge after a %s-day cooldown period.', 
                   v_validation_result.cumulative_referrals, 
                   v_validation_result.required_referrals,
                   v_validation_result.deficit,
                   v_previous_tier,
                   v_agent_profile.current_challenge_tier,
                   get_cooldown_period(v_agent_profile.current_challenge_tier))::TEXT,
            'TIER_DEMOTION'::VARCHAR(50);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clear cooldown and enable challenge retry
CREATE OR REPLACE FUNCTION clear_challenge_cooldown(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE agent_profiles 
    SET 
        can_retry_challenge = TRUE,
        challenge_cooldown_end = NULL,
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND challenge_cooldown_end IS NOT NULL 
    AND challenge_cooldown_end <= NOW();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get challenge status including cooldown info
CREATE OR REPLACE FUNCTION get_challenge_status(p_user_id UUID)
RETURNS TABLE (
    current_tier VARCHAR(20),
    challenge_tier VARCHAR(20),
    challenge_active BOOLEAN,
    can_retry BOOLEAN,
    cooldown_remaining_hours INTEGER,
    status_message TEXT
) AS $$
DECLARE
    v_agent_profile agent_profiles%ROWTYPE;
    v_remaining_hours INTEGER;
BEGIN
    SELECT * INTO v_agent_profile FROM agent_profiles WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::VARCHAR(20), NULL::VARCHAR(20), FALSE, FALSE, 0, 'Agent profile not found'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate remaining cooldown hours
    IF v_agent_profile.challenge_cooldown_end IS NOT NULL AND v_agent_profile.challenge_cooldown_end > NOW() THEN
        v_remaining_hours := EXTRACT(HOUR FROM v_agent_profile.challenge_cooldown_end - NOW())::INTEGER;
    ELSE
        v_remaining_hours := 0;
    END IF;
    
    RETURN QUERY SELECT 
        v_agent_profile.current_tier,
        v_agent_profile.current_challenge_tier,
        v_agent_profile.is_challenge_active,
        v_agent_profile.can_retry_challenge AND (v_agent_profile.challenge_cooldown_end IS NULL OR v_agent_profile.challenge_cooldown_end <= NOW()),
        v_remaining_hours,
        CASE 
            WHEN v_agent_profile.is_challenge_active THEN 'Challenge in progress'
            WHEN v_remaining_hours > 0 THEN FORMAT('Cooldown: %s hours remaining', v_remaining_hours)
            WHEN v_agent_profile.can_retry_challenge THEN 'Ready for new challenge'
            ELSE 'Challenge disabled'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get required referrals for a tier based on hybrid system
CREATE OR REPLACE FUNCTION get_referral_requirement(target_tier VARCHAR(20), direct_count INTEGER, network_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- First 4 tiers: Use direct referrals only
    IF target_tier IN ('rookie', 'bronze', 'iron', 'steel') THEN
        RETURN direct_count;
    -- Advanced tiers: Use total network (direct + level 1 indirect)
    ELSE
        RETURN network_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check if agent meets tier requirements using hybrid system
CREATE OR REPLACE FUNCTION check_hybrid_tier_progression(user_id UUID, target_tier VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
    agent_profile RECORD;
    tier_requirement INTEGER;
    current_count INTEGER;
BEGIN
    -- Get agent profile
    SELECT * INTO agent_profile FROM agent_profiles WHERE agent_profiles.user_id = check_hybrid_tier_progression.user_id;
    
    -- Get tier requirement
    SELECT referral_requirement INTO tier_requirement FROM agent_tiers WHERE tier_name = target_tier;
    
    -- Get current count based on hybrid system
    IF target_tier IN ('rookie', 'bronze', 'iron', 'steel') THEN
        -- Use challenge direct referrals for first 4 tiers
        current_count := agent_profile.challenge_direct_referrals;
    ELSE
        -- Use challenge total network for advanced tiers
        current_count := agent_profile.challenge_total_network;
    END IF;
    
    RETURN current_count >= tier_requirement;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 10. SAMPLE DATA FOR TESTING
-- ================================================================

-- This will be populated by the application
-- Sample agent profiles can be created via the admin panel

COMMENT ON TABLE agent_tiers IS 'Defines all agent tier levels with requirements and benefits';
COMMENT ON TABLE agent_profiles IS 'Tracks individual agent progression and current status';
COMMENT ON TABLE agent_challenge_history IS 'Historical record of all agent tier challenges';
COMMENT ON TABLE agent_commission_transactions IS 'All commission transactions for agents';
COMMENT ON TABLE withdrawal_requests IS 'Enhanced withdrawal system with agent-specific features';
COMMENT ON TABLE agent_weekly_performance IS 'Weekly performance tracking for commission calculations';
