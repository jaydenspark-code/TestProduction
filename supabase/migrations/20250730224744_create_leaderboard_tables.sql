-- =============================================================================
-- Table: user_rankings
-- =============================================================================
CREATE TABLE public.user_rankings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    points BIGINT DEFAULT 0,
    rank INTEGER,
    rank_category VARCHAR(50) NOT NULL, -- 'regular' or 'agent'
    opt_in BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, rank_category)
);

-- Enable RLS
ALTER TABLE public.user_rankings ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view all rankings (for leaderboard)
CREATE POLICY "Allow users to view all rankings"
ON public.user_rankings FOR SELECT
USING (true);

-- Users can update their own opt-in status
CREATE POLICY "Allow users to update their own opt-in status"
ON public.user_rankings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- System/admin can update all rankings
CREATE POLICY "Allow system to update all rankings"
ON public.user_rankings FOR ALL
USING (auth.role() IN ('service_role', 'authenticated'));

-- Create index for faster ranking queries
CREATE INDEX idx_user_rankings_points ON public.user_rankings(points DESC, rank_category);
CREATE INDEX idx_user_rankings_user ON public.user_rankings(user_id);

-- Function to update user ranks
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ranks for the specific category
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY rank_category ORDER BY points DESC) as new_rank
    FROM public.user_rankings
    WHERE opt_in = true
    AND rank_category = NEW.rank_category
  )
  UPDATE public.user_rankings ur
  SET rank = ru.new_rank
  FROM ranked_users ru
  WHERE ur.id = ru.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ranks when points change
CREATE TRIGGER update_ranks_trigger
AFTER INSERT OR UPDATE OF points, opt_in ON public.user_rankings
FOR EACH ROW
EXECUTE FUNCTION update_user_ranks();