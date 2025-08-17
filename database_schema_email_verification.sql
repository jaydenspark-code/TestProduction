-- =============================================================================
-- EMAIL VERIFICATION TABLE SCHEMA (SendGrid Integration)
-- =============================================================================
-- This script creates the email_verifications table for custom SendGrid email verification
-- Run this in your Supabase SQL Editor

-- Drop existing table if it exists (for clean setup)
DROP TABLE IF EXISTS email_verifications CASCADE;

-- Create email_verifications table
CREATE TABLE email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create indexes for performance
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Enable Row Level Security
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy 1: Allow anonymous access for verification (needed for email links)
CREATE POLICY "Allow anonymous verification" ON email_verifications
    FOR SELECT USING (true);

-- Policy 2: Users can view their own verification records
CREATE POLICY "Users can view own email verifications" ON email_verifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy 3: Service role can manage all verification records
CREATE POLICY "Service role can manage email verifications" ON email_verifications
    FOR ALL USING (auth.role() = 'service_role');

-- Policy 4: Allow anonymous insert for registration flow
CREATE POLICY "Allow anonymous insert for registration" ON email_verifications
    FOR INSERT WITH CHECK (true);

-- Policy 5: Allow anonymous update for token usage tracking
CREATE POLICY "Allow anonymous update for token usage" ON email_verifications
    FOR UPDATE USING (true);

-- Policy 6: Allow anonymous delete for cleanup
CREATE POLICY "Allow anonymous delete for cleanup" ON email_verifications
    FOR DELETE USING (true);

-- Add cleanup function to remove expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_email_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM email_verifications 
    WHERE expires_at < NOW() - INTERVAL '1 day';
    
    -- Log cleanup activity
    RAISE NOTICE 'Cleaned up expired email verification tokens';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_email_verifications() TO anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_email_verifications() TO authenticated;

-- Add table comments for documentation
COMMENT ON TABLE email_verifications IS 'Stores email verification tokens for SendGrid integration';
COMMENT ON COLUMN email_verifications.token IS 'Unique verification token sent via SendGrid email';
COMMENT ON COLUMN email_verifications.expires_at IS 'Token expiration timestamp (24 hours from creation)';
COMMENT ON COLUMN email_verifications.used_at IS 'Timestamp when token was successfully used for verification';

-- Verify table creation
SELECT 
    'email_verifications table created successfully' as status,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'email_verifications'
    ) AS table_exists;
