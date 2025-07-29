-- Create email_verifications table for SendGrid email verification
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Indexes for performance
    INDEX idx_email_verifications_token (token),
    INDEX idx_email_verifications_email (email),
    INDEX idx_email_verifications_user_id (user_id),
    INDEX idx_email_verifications_expires_at (expires_at)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own verification records
CREATE POLICY "Users can view own email verifications" ON email_verifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Service role can manage all verification records
CREATE POLICY "Service role can manage email verifications" ON email_verifications
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Allow anonymous access for verification (needed for email links)
CREATE POLICY "Allow anonymous verification" ON email_verifications
    FOR SELECT USING (true);

-- Add cleanup function to remove expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_email_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM email_verifications 
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired tokens (runs daily)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-email-verifications', '0 2 * * *', 'SELECT cleanup_expired_email_verifications();');

COMMENT ON TABLE email_verifications IS 'Stores email verification tokens for SendGrid integration';
COMMENT ON COLUMN email_verifications.token IS 'Unique verification token sent via email';
COMMENT ON COLUMN email_verifications.expires_at IS 'Token expiration timestamp (24 hours from creation)';
COMMENT ON COLUMN email_verifications.used_at IS 'Timestamp when token was successfully used';