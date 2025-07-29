-- Add missing indexes for performance
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_transactions_user_date ON transactions(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_referrals_status ON referrals(status, created_at);
CREATE INDEX CONCURRENTLY idx_user_behavior_logs_user_action ON user_behavior_logs(user_id, action, timestamp);

-- Optimize AI queries
CREATE INDEX CONCURRENTLY idx_ai_predictions_user_type ON ai_predictions(user_id, type, created_at);
CREATE INDEX CONCURRENTLY idx_user_segments_name ON user_segments(segment_name);