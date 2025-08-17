# 🚀 EMAIL VERIFICATION FIX - Complete Solution

## Problem Identified:
Your SendGrid verification emails point to `https://your-project.supabase.co/functions/v1/verify-email` but this Edge Function is not deployed, causing broken verification links.

## Solution Steps:

### Step 1: Apply Database Components
Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email ON public.email_verification_tokens(email);

-- Enable RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Allow public access to verification tokens" ON public.email_verification_tokens;
CREATE POLICY "Allow public access to verification tokens" ON public.email_verification_tokens
    FOR ALL USING (true);

-- Function to verify custom email token and update Supabase auth
CREATE OR REPLACE FUNCTION public.verify_email_token(verification_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token_record RECORD;
    result jsonb;
BEGIN
    -- Find the token
    SELECT * INTO token_record
    FROM public.email_verification_tokens
    WHERE token = verification_token
    AND expires_at > NOW()
    AND used_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired verification token'
        );
    END IF;
    
    -- Mark token as used
    UPDATE public.email_verification_tokens
    SET used_at = NOW()
    WHERE id = token_record.id;
    
    -- Update Supabase auth.users email_confirmed_at
    UPDATE auth.users
    SET 
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = token_record.user_id;
    
    -- Update public.users verification status
    UPDATE public.users
    SET 
        is_verified = true,
        updated_at = NOW()
    WHERE id = token_record.user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', token_record.user_id,
        'email', token_record.email,
        'message', 'Email verified successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Function to create verification token
CREATE OR REPLACE FUNCTION public.create_verification_token(user_id_param UUID, email_param TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    verification_token TEXT;
    expires_at_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate secure token
    verification_token := encode(gen_random_bytes(32), 'hex') || '-' || extract(epoch from now())::text;
    
    -- Set expiration to 24 hours from now
    expires_at_time := NOW() + INTERVAL '24 hours';
    
    -- Insert token
    INSERT INTO public.email_verification_tokens (user_id, email, token, expires_at)
    VALUES (user_id_param, email_param, verification_token, expires_at_time);
    
    RETURN jsonb_build_object(
        'success', true,
        'token', verification_token,
        'expires_at', expires_at_time
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.email_verification_tokens TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_email_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_verification_token TO anon, authenticated;

-- Test the function (should return success: false because token doesn't exist)
SELECT verify_email_token('test-token-123');
```

### Step 2: Deploy Edge Function
Run this command in your terminal:

```bash
supabase functions deploy verify-email --project-ref bmtaqilpuszwoshtizmq
```

### Step 3: Test
1. Register a new user
2. Check that the verification email is sent
3. Click the verification link
4. You should see a professional success page that redirects to payment

## What This Fixes:

✅ **Broken verification links** - Edge Function will now exist and work
✅ **Database integration** - Custom tokens work with Supabase auth
✅ **Professional experience** - Users get a nice success page
✅ **Automatic redirect** - Verified users go straight to payment

## Your System is Superior:
- Custom SendGrid emails with professional branding
- Better deliverability than Supabase native emails
- Full control over email content and styling
- Token-based verification with 24-hour expiration

The only missing piece was the deployed Edge Function - once that's deployed, your email verification will work perfectly!
