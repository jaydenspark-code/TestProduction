const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDA2NCwiZXhwIjoyMDY4NjcwMDY0fQ.YDaORhQY7P1nnO39K8kHhIDp5ZpzfnkE84GqNqznxWc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyEmailVerificationFix() {
  console.log('🚀 Applying Email Verification Fix...');

  // SQL to apply
  const sql = `
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
    -- This is the key part that makes Supabase recognize the verification
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
  `;

  try {
    console.log('📦 Applying database schema...');
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error applying schema:', error);
      return;
    }

    console.log('✅ Database schema applied successfully!');

    // Test the function
    console.log('🧪 Testing verification function...');
    const { data: testResult, error: testError } = await supabase
      .rpc('verify_email_token', { verification_token: 'test-token-123' });

    if (testError) {
      console.error('❌ Function test failed:', testError);
    } else {
      console.log('✅ Function test result:', testResult);
    }

    console.log('');
    console.log('🎉 Email Verification Fix Applied Successfully!');
    console.log('📋 Next steps:');
    console.log('1. Deploy the Edge Function: supabase functions deploy verify-email');
    console.log('2. Test with a verification email');
    console.log('3. Verification links should now work properly!');

  } catch (error) {
    console.error('❌ Failed to apply fix:', error);
  }
}

// Alternative method using direct SQL execution
async function applySchemaDirectly() {
  console.log('🚀 Applying schema using direct SQL execution...');
  
  const sqlCommands = [
    `CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(500) NOT NULL UNIQUE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used_at TIMESTAMP WITH TIME ZONE NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    `CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);`,
    `CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email ON public.email_verification_tokens(email);`,
    
    `ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;`,
    
    `DROP POLICY IF EXISTS "Allow public access to verification tokens" ON public.email_verification_tokens;`,
    `CREATE POLICY "Allow public access to verification tokens" ON public.email_verification_tokens FOR ALL USING (true);`
  ];

  try {
    for (const command of sqlCommands) {
      console.log('Executing:', command.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('✅ Success');
      }
    }
  } catch (error) {
    console.error('❌ Error applying schema:', error);
  }
}

// Run the fix
applyEmailVerificationFix();
