-- =============================================================================
-- EARNPRO AI FEATURES ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- This script enables RLS on all AI-specific tables.
-- These tables store personalization data, behavior logs, and AI insights.
-- Note: Some tables may not exist yet - this is normal for optional AI features
-- =============================================================================

-- =============================================================================
-- Table: user_personalization_profiles (if exists)
-- =============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_personalization_profiles') THEN
    ALTER TABLE public.user_personalization_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Users can manage their own personalization profiles
    CREATE POLICY "Allow users to manage their own personalization profiles"
    ON public.user_personalization_profiles FOR ALL
    USING (auth.uid() = user_id);
    
    -- Admins can view all personalization profiles (for analysis)
    CREATE POLICY "Allow admins to view all personalization profiles"
    ON public.user_personalization_profiles FOR SELECT
    USING (get_my_role() IN ('admin', 'superadmin'));
  END IF;
END $$;

-- =============================================================================
-- Table: user_behavior_logs (if exists)
-- =============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_behavior_logs') THEN
    ALTER TABLE public.user_behavior_logs ENABLE ROW LEVEL SECURITY;
    
    -- Users can view their own behavior logs
    CREATE POLICY "Allow users to view their own behavior logs"
    ON public.user_behavior_logs FOR SELECT
    USING (auth.uid() = user_id);
    
    -- System can insert behavior logs for authenticated users
    CREATE POLICY "Allow system to insert behavior logs"
    ON public.user_behavior_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
    -- Admins can view all behavior logs (for analytics)
    CREATE POLICY "Allow admins to view all behavior logs"
    ON public.user_behavior_logs FOR SELECT
    USING (get_my_role() IN ('admin', 'superadmin'));
  END IF;
END $$;

-- =============================================================================
-- Table: content_library (if exists)
-- =============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'content_library') THEN
    ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;
    
    -- All authenticated users can view published content
    CREATE POLICY "Allow authenticated users to view published content"
    ON public.content_library FOR SELECT
    USING (status = 'published' AND auth.role() = 'authenticated');
    
    -- Admins can manage all content
    CREATE POLICY "Allow admins to manage all content"
    ON public.content_library FOR ALL
    USING (get_my_role() IN ('admin', 'superadmin'));
  END IF;
END $$;

-- =============================================================================
-- Table: user_matching_profiles (if exists)
-- =============================================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_matching_profiles') THEN
    ALTER TABLE public.user_matching_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Users can manage their own matching profiles
    CREATE POLICY "Allow users to manage their own matching profiles"
    ON public.user_matching_profiles FOR ALL
    USING (auth.uid() = user_id);
    
    -- System can read matching profiles for authenticated users (for matching algorithm)
    CREATE POLICY "Allow system to read matching profiles for matching"
    ON public.user_matching_profiles FOR SELECT
    USING (auth.role() = 'authenticated');
    
    -- Admins can view all matching profiles
    CREATE POLICY "Allow admins to view all matching profiles"
    ON public.user_matching_profiles FOR SELECT
    USING (get_my_role() IN ('admin', 'superadmin'));
  END IF;
END $$;

-- =============================================================================
-- Additional AI tables (conditional creation)
-- =============================================================================
-- Only create policies for tables that exist
-- This prevents errors during migration if AI tables haven't been created yet
