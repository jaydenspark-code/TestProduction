-- =============================================================================
-- EARNPRO AI FEATURES ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- This script enables RLS on all AI-specific tables.
-- These tables store personalization data, behavior logs, and AI insights.
-- =============================================================================

-- =============================================================================
-- Table: user_personalization_profiles
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.user_personalization_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can manage their own personalization profiles
CREATE POLICY "Allow users to manage their own personalization profiles"
ON public.user_personalization_profiles FOR ALL
USING (auth.uid() = user_id);

-- Admins can view all personalization profiles (for analysis)
CREATE POLICY "Allow admins to view all personalization profiles"
ON public.user_personalization_profiles FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: user_behavior_logs
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.user_behavior_logs ENABLE ROW LEVEL SECURITY;

-- 2. Policies
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


-- =============================================================================
-- Table: content_library
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- All authenticated users can view published content
CREATE POLICY "Allow authenticated users to view published content"
ON public.content_library FOR SELECT
USING (status = 'published' AND auth.role() = 'authenticated');

-- Admins can manage all content
CREATE POLICY "Allow admins to manage all content"
ON public.content_library FOR ALL
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: user_matching_profiles
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.user_matching_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Policies
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


-- =============================================================================
-- Table: referral_matches
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.referral_matches ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can see their own matches (as referrer or target)
CREATE POLICY "Allow users to see their own matches"
ON public.referral_matches FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = target_user_id);

-- Admins can see all matches
CREATE POLICY "Allow admins to see all matches"
ON public.referral_matches FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: campaign_optimizations
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.campaign_optimizations ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Campaign owners can see optimizations for their campaigns
CREATE POLICY "Allow campaign owners to see their optimizations"
ON public.campaign_optimizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id AND c.advertiser_id = auth.uid()
  )
);

-- Admins can see all campaign optimizations
CREATE POLICY "Allow admins to see all campaign optimizations"
ON public.campaign_optimizations FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: ai_predictions
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can see predictions about themselves
CREATE POLICY "Allow users to see their own predictions"
ON public.ai_predictions FOR SELECT
USING (auth.uid() = user_id);

-- Admins can see all predictions
CREATE POLICY "Allow admins to see all predictions"
ON public.ai_predictions FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: user_segments
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.user_segments ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can see which segment they belong to
CREATE POLICY "Allow users to see their own segment"
ON public.user_segments FOR SELECT
USING (auth.uid() = user_id);

-- Admins can see all user segments
CREATE POLICY "Allow admins to see all user segments"
ON public.user_segments FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: anomaly_detections
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.anomaly_detections ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can see anomalies related to their account
CREATE POLICY "Allow users to see their own anomalies"
ON public.anomaly_detections FOR SELECT
USING (auth.uid() = user_id);

-- Admins can see all anomalies
CREATE POLICY "Allow admins to see all anomalies"
ON public.anomaly_detections FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: user_behavior_patterns
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.user_behavior_patterns ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can see their own behavior patterns
CREATE POLICY "Allow users to see their own behavior patterns"
ON public.user_behavior_patterns FOR SELECT
USING (auth.uid() = user_id);

-- Admins can see all behavior patterns
CREATE POLICY "Allow admins to see all behavior patterns"
ON public.user_behavior_patterns FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: live_events
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can see events related to them
CREATE POLICY "Allow users to see their own events"
ON public.live_events FOR SELECT
USING (auth.uid() = user_id);

-- System can insert events for authenticated users
CREATE POLICY "Allow system to insert events"
ON public.live_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can see all events
CREATE POLICY "Allow admins to see all events"
ON public.live_events FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: ai_metrics
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Only admins can see AI system metrics
CREATE POLICY "Allow admins to see AI metrics"
ON public.ai_metrics FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));


-- =============================================================================
-- Table: user_recommendations
-- =============================================================================
-- 1. Enable RLS
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

-- 2. Policies
-- Users can see their own recommendations
CREATE POLICY "Allow users to see their own recommendations"
ON public.user_recommendations FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own recommendations (mark as used, etc.)
CREATE POLICY "Allow users to update their own recommendations"
ON public.user_recommendations FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can see all recommendations
CREATE POLICY "Allow admins to see all recommendations"
ON public.user_recommendations FOR SELECT
USING (get_my_role() IN ('admin', 'superadmin'));
