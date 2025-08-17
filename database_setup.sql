-- Email verifications table for storing verification tokens
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_email_verifications_token (token),
    INDEX idx_email_verifications_user_id (user_id),
    INDEX idx_email_verifications_email (email)
);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Policies for email_verifications
CREATE POLICY "Users can insert their own verification tokens" ON public.email_verifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own verification tokens" ON public.email_verifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own verification tokens" ON public.email_verifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.email_verifications TO anon;
GRANT ALL ON public.email_verifications TO authenticated;

-- Grant usage on the sequence
GRANT USAGE, SELECT ON SEQUENCE public.email_verifications_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.email_verifications_id_seq TO authenticated;
