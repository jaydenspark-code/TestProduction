-- Earnings system database schema and functions

-- Create earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('referral', 'task', 'ad_view', 'activity', 'bonus', 'commission')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  reference_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_balances table
CREATE TABLE IF NOT EXISTS user_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_earnings >= 0),
  withdrawn_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (withdrawn_amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL,
  payment_details JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - fee_amount) STORED,
  gateway VARCHAR(50),
  gateway_transaction_id VARCHAR(255),
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_activities table
CREATE TABLE IF NOT EXISTS referral_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  activity_type VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create balance_updates table for real-time notifications
CREATE TABLE IF NOT EXISTS balance_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_type ON earnings(type);
CREATE INDEX IF NOT EXISTS idx_earnings_created_at ON earnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_reference_id ON earnings(reference_id);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_activities_referrer ON referral_activities(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_activities_referred ON referral_activities(referred_user_id);

CREATE INDEX IF NOT EXISTS idx_balance_updates_user_id ON balance_updates(user_id);

-- Function to add earnings and update balance
CREATE OR REPLACE FUNCTION add_user_earnings(
  p_user_id UUID,
  p_type VARCHAR,
  p_amount DECIMAL,
  p_currency VARCHAR DEFAULT 'USD',
  p_description TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}',
  p_reference_id VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_earnings_id UUID;
BEGIN
  -- Insert earnings record
  INSERT INTO earnings (
    user_id, type, amount, currency, description, metadata, reference_id
  ) VALUES (
    p_user_id, p_type, p_amount, p_currency, p_description, p_metadata, p_reference_id
  ) RETURNING id INTO v_earnings_id;

  -- Update or create user balance
  INSERT INTO user_balances (user_id, available_balance, total_earnings, currency)
  VALUES (p_user_id, p_amount, p_amount, p_currency)
  ON CONFLICT (user_id) DO UPDATE SET
    available_balance = user_balances.available_balance + p_amount,
    total_earnings = user_balances.total_earnings + p_amount,
    updated_at = NOW();

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in add_user_earnings: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update balance for withdrawal
CREATE OR REPLACE FUNCTION update_balance_for_withdrawal(
  p_user_id UUID,
  p_amount DECIMAL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Move amount from available to pending (withdrawal processing)
  UPDATE user_balances 
  SET 
    available_balance = available_balance - p_amount,
    pending_balance = pending_balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id 
    AND available_balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or user not found';
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in update_balance_for_withdrawal: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete withdrawal
CREATE OR REPLACE FUNCTION complete_withdrawal(
  p_withdrawal_id UUID,
  p_gateway_transaction_id VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_amount DECIMAL;
  v_fee_amount DECIMAL;
BEGIN
  -- Get withdrawal details
  SELECT user_id, amount, fee_amount 
  INTO v_user_id, v_amount, v_fee_amount
  FROM withdrawal_requests 
  WHERE id = p_withdrawal_id AND status = 'processing';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found or not in processing status';
  END IF;

  -- Update withdrawal status
  UPDATE withdrawal_requests 
  SET 
    status = 'completed',
    gateway_transaction_id = p_gateway_transaction_id,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_withdrawal_id;

  -- Update user balance
  UPDATE user_balances 
  SET 
    pending_balance = pending_balance - v_amount,
    withdrawn_amount = withdrawn_amount + v_amount,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in complete_withdrawal: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fail withdrawal
CREATE OR REPLACE FUNCTION fail_withdrawal(
  p_withdrawal_id UUID,
  p_failure_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_amount DECIMAL;
BEGIN
  -- Get withdrawal details
  SELECT user_id, amount 
  INTO v_user_id, v_amount
  FROM withdrawal_requests 
  WHERE id = p_withdrawal_id AND status IN ('pending', 'processing');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found or already processed';
  END IF;

  -- Update withdrawal status
  UPDATE withdrawal_requests 
  SET 
    status = 'failed',
    failure_reason = p_failure_reason,
    updated_at = NOW()
  WHERE id = p_withdrawal_id;

  -- Restore user balance (move from pending back to available)
  UPDATE user_balances 
  SET 
    available_balance = available_balance + v_amount,
    pending_balance = pending_balance - v_amount,
    updated_at = NOW()
  WHERE user_id = v_user_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in fail_withdrawal: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user earnings summary
CREATE OR REPLACE FUNCTION get_user_earnings_summary(
  p_user_id UUID,
  p_period VARCHAR DEFAULT 'all' -- 'day', 'week', 'month', 'year', 'all'
) RETURNS TABLE (
  type VARCHAR,
  total_amount DECIMAL,
  count BIGINT
) AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determine date range
  CASE p_period
    WHEN 'day' THEN v_start_date := NOW() - INTERVAL '1 day';
    WHEN 'week' THEN v_start_date := NOW() - INTERVAL '1 week';
    WHEN 'month' THEN v_start_date := NOW() - INTERVAL '1 month';
    WHEN 'year' THEN v_start_date := NOW() - INTERVAL '1 year';
    ELSE v_start_date := '1970-01-01'::TIMESTAMP WITH TIME ZONE;
  END CASE;

  RETURN QUERY
  SELECT 
    e.type,
    SUM(e.amount) as total_amount,
    COUNT(*) as count
  FROM earnings e
  WHERE e.user_id = p_user_id 
    AND e.status = 'confirmed'
    AND e.created_at >= v_start_date
  GROUP BY e.type
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_earnings_updated_at BEFORE UPDATE ON earnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for earnings
CREATE POLICY "Users can view their own earnings" ON earnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert earnings" ON earnings
  FOR INSERT WITH CHECK (true); -- Will be restricted via service role

-- RLS Policies for user_balances
CREATE POLICY "Users can view their own balance" ON user_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage balances" ON user_balances
  FOR ALL USING (true); -- Will be restricted via service role

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawals" ON withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" ON withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update withdrawals" ON withdrawal_requests
  FOR UPDATE USING (true); -- Will be restricted via service role

-- RLS Policies for referral_activities
CREATE POLICY "Users can view their referral activities" ON referral_activities
  FOR SELECT USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert referral activities" ON referral_activities
  FOR INSERT WITH CHECK (true); -- Will be restricted via service role

-- RLS Policies for balance_updates
CREATE POLICY "Users can view their balance updates" ON balance_updates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert balance updates" ON balance_updates
  FOR INSERT WITH CHECK (true); -- Will be restricted via service role

-- Grant permissions to authenticated users
GRANT SELECT ON earnings TO authenticated;
GRANT SELECT ON user_balances TO authenticated;
GRANT SELECT, INSERT ON withdrawal_requests TO authenticated;
GRANT SELECT ON referral_activities TO authenticated;
GRANT SELECT ON balance_updates TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION add_user_earnings TO service_role;
GRANT EXECUTE ON FUNCTION update_balance_for_withdrawal TO service_role;
GRANT EXECUTE ON FUNCTION complete_withdrawal TO service_role;
GRANT EXECUTE ON FUNCTION fail_withdrawal TO service_role;
GRANT EXECUTE ON FUNCTION get_user_earnings_summary TO authenticated;
