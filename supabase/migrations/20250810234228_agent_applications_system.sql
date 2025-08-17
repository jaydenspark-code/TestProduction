-- Agent Applications System Schema
-- This schema handles the AI-powered agent application review system

-- Social Media Platform Requirements Configuration
CREATE TABLE IF NOT EXISTS social_media_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name VARCHAR(50) UNIQUE NOT NULL,
  min_followers INTEGER NOT NULL,
  verification_method VARCHAR(20) DEFAULT 'manual', -- 'api', 'manual'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Applications Table
CREATE TABLE IF NOT EXISTS agent_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  application_data JSONB NOT NULL, -- Personal info, motivation, etc.
  social_media_profiles JSONB NOT NULL, -- Platform data with follower counts
  
  -- AI Review Data
  ai_score DECIMAL(5,2) DEFAULT 0, -- 0-100 score
  ai_decision VARCHAR(20) DEFAULT 'pending', -- 'approved', 'rejected', 'flagged', 'pending'
  ai_decision_reason TEXT,
  ai_compliance_details JSONB, -- Detailed platform compliance data
  
  -- Admin Review Data
  admin_status VARCHAR(20) DEFAULT 'pending', -- 'approved', 'rejected', 'pending'
  admin_reviewed_by UUID REFERENCES auth.users(id),
  admin_review_reason TEXT,
  admin_review_date TIMESTAMP WITH TIME ZONE,
  
  -- Application Status
  final_status VARCHAR(20) DEFAULT 'pending', -- 'approved', 'rejected', 'pending'
  is_reapplication BOOLEAN DEFAULT false,
  previous_application_id UUID,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application Review History
CREATE TABLE IF NOT EXISTS application_review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES agent_applications(id) ON DELETE CASCADE,
  reviewer_type VARCHAR(10) NOT NULL, -- 'ai', 'admin'
  reviewer_id UUID, -- NULL for AI, user_id for admin
  action VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'flagged'
  reason TEXT,
  review_data JSONB, -- Additional review metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application Reports and Analytics
CREATE TABLE IF NOT EXISTS application_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE DEFAULT CURRENT_DATE,
  total_applications INTEGER DEFAULT 0,
  ai_approved INTEGER DEFAULT 0,
  ai_rejected INTEGER DEFAULT 0,
  ai_flagged INTEGER DEFAULT 0,
  admin_approved INTEGER DEFAULT 0,
  admin_rejected INTEGER DEFAULT 0,
  admin_overrides INTEGER DEFAULT 0, -- Admin decisions that differed from AI
  average_ai_score DECIMAL(5,2) DEFAULT 0,
  platform_stats JSONB, -- Platform-specific statistics
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default platform requirements
INSERT INTO social_media_platforms (platform_name, min_followers) VALUES
  ('telegram', 5000),
  ('youtube', 5000),
  ('snapchat', 5000),
  ('linkedin', 1000),
  ('twitter', 10000),
  ('whatsapp', 10000),
  ('tiktok', 10000),
  ('instagram', 10000),
  ('facebook', 10000),
  ('twitch', 1000),
  ('other', 1000)
ON CONFLICT (platform_name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_applications_user_id ON agent_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_applications_status ON agent_applications(final_status);
CREATE INDEX IF NOT EXISTS idx_agent_applications_ai_decision ON agent_applications(ai_decision);
CREATE INDEX IF NOT EXISTS idx_agent_applications_submitted_at ON agent_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_application_review_history_application_id ON application_review_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_reports_date ON application_reports(report_date);

-- RLS Policies
ALTER TABLE social_media_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_review_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_reports ENABLE ROW LEVEL SECURITY;

-- Admin can see all data
CREATE POLICY "Admin full access social_media_platforms" ON social_media_platforms
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access agent_applications" ON agent_applications
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access application_review_history" ON application_review_history
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access application_reports" ON application_reports
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Users can see their own applications
CREATE POLICY "Users can see own applications" ON agent_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own applications
CREATE POLICY "Users can insert own applications" ON agent_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to process AI review of application
CREATE OR REPLACE FUNCTION process_ai_application_review(
  p_application_id UUID
) RETURNS TABLE (
  success BOOLEAN,
  ai_score DECIMAL,
  ai_decision VARCHAR,
  compliance_details JSONB,
  message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_application agent_applications%ROWTYPE;
  v_platform_requirements social_media_platforms%ROWTYPE;
  v_social_media JSONB;
  v_platform_key TEXT;
  v_platform_data JSONB;
  v_follower_count INTEGER;
  v_total_score DECIMAL := 0;
  v_max_score DECIMAL := 0;
  v_platform_count INTEGER := 0;
  v_compliance_details JSONB := '{}';
  v_compliant_platforms INTEGER := 0;
  v_decision VARCHAR(20);
  v_reason TEXT := '';
  v_flagged_platforms TEXT[] := '{}';
BEGIN
  -- Get application data
  SELECT * INTO v_application FROM agent_applications WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'error'::VARCHAR, '{}'::JSONB, 'Application not found'::TEXT;
    RETURN;
  END IF;

  v_social_media := v_application.social_media_profiles;
  
  -- Process each social media platform in the application
  FOR v_platform_key IN SELECT jsonb_object_keys(v_social_media)
  LOOP
    v_platform_data := v_social_media -> v_platform_key;
    v_follower_count := (v_platform_data ->> 'followers')::INTEGER;
    
    -- Get platform requirements (use 'other' as fallback)
    SELECT * INTO v_platform_requirements 
    FROM social_media_platforms 
    WHERE platform_name = v_platform_key OR (platform_name = 'other' AND v_platform_key NOT IN (
      SELECT platform_name FROM social_media_platforms WHERE platform_name != 'other'
    ))
    ORDER BY CASE WHEN platform_name = v_platform_key THEN 1 ELSE 2 END
    LIMIT 1;
    
    IF FOUND THEN
      v_platform_count := v_platform_count + 1;
      v_max_score := v_max_score + 100;
      
      -- Calculate score for this platform
      IF v_follower_count >= v_platform_requirements.min_followers THEN
        -- Full compliance
        v_total_score := v_total_score + 100;
        v_compliant_platforms := v_compliant_platforms + 1;
        v_compliance_details := v_compliance_details || jsonb_build_object(
          v_platform_key,
          jsonb_build_object(
            'status', 'compliant',
            'followers', v_follower_count,
            'required', v_platform_requirements.min_followers,
            'score', 100
          )
        );
      ELSIF v_follower_count >= (v_platform_requirements.min_followers * 0.8) THEN
        -- Close to requirements (80%+) - partial score
        v_total_score := v_total_score + 60;
        v_flagged_platforms := v_flagged_platforms || v_platform_key;
        v_compliance_details := v_compliance_details || jsonb_build_object(
          v_platform_key,
          jsonb_build_object(
            'status', 'close',
            'followers', v_follower_count,
            'required', v_platform_requirements.min_followers,
            'score', 60,
            'deficit', v_platform_requirements.min_followers - v_follower_count
          )
        );
      ELSE
        -- Non-compliant
        v_total_score := v_total_score + 0;
        v_compliance_details := v_compliance_details || jsonb_build_object(
          v_platform_key,
          jsonb_build_object(
            'status', 'non_compliant',
            'followers', v_follower_count,
            'required', v_platform_requirements.min_followers,
            'score', 0,
            'deficit', v_platform_requirements.min_followers - v_follower_count
          )
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Calculate final score
  IF v_max_score > 0 THEN
    v_total_score := (v_total_score / v_max_score) * 100;
  ELSE
    v_total_score := 0;
  END IF;
  
  -- Determine AI decision
  IF v_total_score >= 90 AND v_compliant_platforms = v_platform_count THEN
    v_decision := 'approved';
    v_reason := 'All platforms meet requirements. Automatic approval.';
  ELSIF v_total_score >= 60 AND array_length(v_flagged_platforms, 1) > 0 THEN
    v_decision := 'flagged';
    v_reason := 'Some platforms close to requirements. Flagged for admin review: ' || array_to_string(v_flagged_platforms, ', ');
  ELSE
    v_decision := 'rejected';
    v_reason := 'Insufficient follower counts across platforms.';
  END IF;
  
  -- Update application with AI review results
  UPDATE agent_applications SET
    ai_score = v_total_score,
    ai_decision = v_decision,
    ai_decision_reason = v_reason,
    ai_compliance_details = v_compliance_details,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_application_id;
  
  -- Insert review history
  INSERT INTO application_review_history (
    application_id, reviewer_type, action, reason, review_data
  ) VALUES (
    p_application_id, 'ai', v_decision, v_reason,
    jsonb_build_object('score', v_total_score, 'compliance', v_compliance_details)
  );
  
  -- Return results
  RETURN QUERY SELECT 
    true, 
    v_total_score, 
    v_decision, 
    v_compliance_details,
    v_reason;
END;
$$;

-- Function to handle admin review decision
CREATE OR REPLACE FUNCTION process_admin_application_review(
  p_application_id UUID,
  p_admin_id UUID,
  p_decision VARCHAR,
  p_reason TEXT DEFAULT NULL
) RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_application agent_applications%ROWTYPE;
  v_final_status VARCHAR(20);
BEGIN
  -- Get application
  SELECT * INTO v_application FROM agent_applications WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Application not found'::TEXT;
    RETURN;
  END IF;
  
  -- Determine final status
  v_final_status := p_decision;
  
  -- Update application
  UPDATE agent_applications SET
    admin_status = p_decision,
    admin_reviewed_by = p_admin_id,
    admin_review_reason = p_reason,
    admin_review_date = NOW(),
    final_status = v_final_status,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_application_id;
  
  -- Insert review history
  INSERT INTO application_review_history (
    application_id, reviewer_type, reviewer_id, action, reason
  ) VALUES (
    p_application_id, 'admin', p_admin_id, p_decision, p_reason
  );
  
  -- If approved, activate user as agent
  IF p_decision = 'approved' THEN
    -- Add user to agent_profiles if not exists
    INSERT INTO agent_profiles (user_id, tier_id, is_active)
    SELECT v_application.user_id, 1, true
    WHERE NOT EXISTS (
      SELECT 1 FROM agent_profiles WHERE user_id = v_application.user_id
    );
    
    -- Update user role to agent
    UPDATE auth.users SET 
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "agent"}'::jsonb
    WHERE id = v_application.user_id;
  END IF;
  
  RETURN QUERY SELECT true, 'Application review processed successfully'::TEXT;
END;
$$;

-- Function to generate daily reports
CREATE OR REPLACE FUNCTION generate_daily_application_report(
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total INTEGER;
  v_ai_approved INTEGER;
  v_ai_rejected INTEGER;
  v_ai_flagged INTEGER;
  v_admin_approved INTEGER;
  v_admin_rejected INTEGER;
  v_admin_overrides INTEGER;
  v_avg_score DECIMAL;
  v_platform_stats JSONB;
BEGIN
  -- Calculate statistics for the day
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE ai_decision = 'approved'),
    COUNT(*) FILTER (WHERE ai_decision = 'rejected'),
    COUNT(*) FILTER (WHERE ai_decision = 'flagged'),
    COUNT(*) FILTER (WHERE admin_status = 'approved'),
    COUNT(*) FILTER (WHERE admin_status = 'rejected'),
    COUNT(*) FILTER (WHERE admin_status != ai_decision AND admin_status IS NOT NULL),
    AVG(ai_score)
  INTO v_total, v_ai_approved, v_ai_rejected, v_ai_flagged, 
       v_admin_approved, v_admin_rejected, v_admin_overrides, v_avg_score
  FROM agent_applications 
  WHERE DATE(submitted_at) = p_date;
  
  -- Generate platform statistics
  SELECT jsonb_object_agg(platform, stats) INTO v_platform_stats
  FROM (
    SELECT 
      platform,
      jsonb_build_object(
        'total_applications', COUNT(*),
        'avg_followers', AVG((platform_data ->> 'followers')::INTEGER),
        'compliant', COUNT(*) FILTER (WHERE (platform_data ->> 'followers')::INTEGER >= min_followers)
      ) as stats
    FROM (
      SELECT 
        jsonb_object_keys(social_media_profiles) as platform,
        social_media_profiles -> jsonb_object_keys(social_media_profiles) as platform_data,
        smp.min_followers
      FROM agent_applications aa
      JOIN social_media_platforms smp ON smp.platform_name = jsonb_object_keys(aa.social_media_profiles)
      WHERE DATE(aa.submitted_at) = p_date
    ) platform_data
    GROUP BY platform
  ) platform_stats;
  
  -- Insert or update report
  INSERT INTO application_reports (
    report_date, total_applications, ai_approved, ai_rejected, ai_flagged,
    admin_approved, admin_rejected, admin_overrides, average_ai_score, platform_stats
  ) VALUES (
    p_date, v_total, v_ai_approved, v_ai_rejected, v_ai_flagged,
    v_admin_approved, v_admin_rejected, v_admin_overrides, v_avg_score, v_platform_stats
  )
  ON CONFLICT (report_date) DO UPDATE SET
    total_applications = EXCLUDED.total_applications,
    ai_approved = EXCLUDED.ai_approved,
    ai_rejected = EXCLUDED.ai_rejected,
    ai_flagged = EXCLUDED.ai_flagged,
    admin_approved = EXCLUDED.admin_approved,
    admin_rejected = EXCLUDED.admin_rejected,
    admin_overrides = EXCLUDED.admin_overrides,
    average_ai_score = EXCLUDED.average_ai_score,
    platform_stats = EXCLUDED.platform_stats;
  
  RETURN QUERY SELECT true, 'Daily report generated successfully'::TEXT;
END;
$$;