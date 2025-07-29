-- Create email_verifications table for custom email verification
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    INDEX idx_email_verifications_token ON email_verifications(token),
    INDEX idx_email_verifications_user_id ON email_verifications(user_id),
    INDEX idx_email_verifications_email ON email_verifications(email)
);

-- Enable Row Level Security
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own verification records" ON email_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all verification records" ON email_verifications
    FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous insert for registration flow
CREATE POLICY "Allow anonymous insert for registration" ON email_verifications
    FOR INSERT WITH CHECK (true);
