-- AI Campaigns Table
CREATE TABLE ai_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_audience JSONB,
  budget DECIMAL(10,2),
  duration INTEGER,
  incentive_structure VARCHAR(50),
  incentive_details JSONB,
  custom_incentives JSONB[],
  ai_optimization BOOLEAN DEFAULT true,
  ai_suggestions JSONB,
  predicted_roi JSONB,
  multi_variant_testing JSONB[],
  launch_settings JSONB,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  launched_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Performance Table
CREATE TABLE campaign_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES ai_campaigns(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  referrals INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Participants Table
CREATE TABLE campaign_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES ai_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referrals_count INTEGER DEFAULT 0,
  earnings DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active'
);

-- Indexes for performance
CREATE INDEX idx_ai_campaigns_user_id ON ai_campaigns(user_id);
CREATE INDEX idx_ai_campaigns_status ON ai_campaigns(status);
CREATE INDEX idx_campaign_performance_campaign_id ON campaign_performance(campaign_id);
CREATE INDEX idx_campaign_participants_campaign_id ON campaign_participants(campaign_id);
CREATE INDEX idx_campaign_participants_user_id ON campaign_participants(user_id);