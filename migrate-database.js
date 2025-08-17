const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzMzNzI4NCwiZXhwIjoyMDQ4OTEzMjg0fQ.lM0M4-l1jY6IWlbp9ZcWmHaZ2jj9F0TKCWXBw6WuGXg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDatabaseMigration() {
  console.log('🗃️ Applying new verification code system to database...');

  try {
    // Step 1: Drop old verification system
    console.log('🗑️ Dropping old verification functions and tables...');
    
    await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS public.verify_email_token(TEXT);'
    });
    
    await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS public.email_verification_tokens;'
    });

    // Step 2: Create new verification codes table
    console.log('📋 Creating email_verification_codes table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.email_verification_codes (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          email TEXT NOT NULL,
          code VARCHAR(6) NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          used_at TIMESTAMPTZ NULL,
          attempts INTEGER DEFAULT 0
      );
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Error creating table:', error);
      throw error;
    }

    // Step 3: Create verification function
    console.log('⚙️ Creating verify_email_code function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.verify_email_code(
        user_email TEXT,
        code TEXT
      )
      RETURNS BOOLEAN AS $$
      DECLARE
          code_record RECORD;
      BEGIN
          -- Find the code (case-insensitive)
          SELECT * INTO code_record 
          FROM public.email_verification_codes 
          WHERE UPPER(code) = UPPER($2)
          AND email = $1
          AND used_at IS NULL 
          AND expires_at > NOW()
          AND attempts < 5  -- Max 5 attempts
          LIMIT 1;
          
          -- Increment attempt counter for this code
          UPDATE public.email_verification_codes 
          SET attempts = attempts + 1 
          WHERE UPPER(code) = UPPER($2) AND email = $1;
          
          -- Check if code was found
          IF code_record IS NULL THEN
              RETURN FALSE;
          END IF;
          
          -- Mark code as used
          UPDATE public.email_verification_codes 
          SET used_at = NOW() 
          WHERE id = code_record.id;
          
          -- Update user's email verification status
          UPDATE auth.users 
          SET email_confirmed_at = NOW()
          WHERE id = code_record.user_id
          AND email_confirmed_at IS NULL;
          
          -- Also update in public.users table if it exists
          UPDATE public.users 
          SET is_verified = true
          WHERE id = code_record.user_id;
          
          RETURN TRUE;
          
      EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error in verify_email_code: %', SQLERRM;
          RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (functionError) {
      console.error('❌ Error creating function:', functionError);
      throw functionError;
    }

    // Step 4: Enable RLS and create policies
    console.log('🔒 Setting up RLS policies...');
    
    const rlsSQL = `
      ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow service role full access to email_verification_codes" ON public.email_verification_codes;
      CREATE POLICY "Allow service role full access to email_verification_codes" 
      ON public.email_verification_codes 
      FOR ALL 
      TO service_role 
      USING (true);
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    
    if (rlsError) {
      console.error('❌ Error setting up RLS:', rlsError);
      throw rlsError;
    }

    console.log('✅ Database migration completed successfully!');
    console.log('🎯 New 6-character verification code system is now active');
    console.log('📧 Codes expire in 15 minutes and allow max 5 attempts');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Direct execution approach
async function directExecution() {
  console.log('🚀 Attempting direct database schema creation...');

  try {
    // Create table directly
    const { error: tableError } = await supabase
      .from('email_verification_codes')
      .select('*')
      .limit(1);

    if (tableError && tableError.code === 'PGRST116') {
      console.log('📋 Table does not exist, need to create it via SQL...');
      
      // Use the SQL editor approach
      const sqlCommands = [
        `CREATE TABLE IF NOT EXISTS public.email_verification_codes (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          email TEXT NOT NULL,
          code VARCHAR(6) NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          used_at TIMESTAMPTZ NULL,
          attempts INTEGER DEFAULT 0
        );`,
        
        `CREATE OR REPLACE FUNCTION public.verify_email_code(
          user_email TEXT,
          code TEXT
        )
        RETURNS BOOLEAN AS $$
        DECLARE
            code_record RECORD;
        BEGIN
            SELECT * INTO code_record 
            FROM public.email_verification_codes 
            WHERE UPPER(code) = UPPER($2)
            AND email = $1
            AND used_at IS NULL 
            AND expires_at > NOW()
            AND attempts < 5
            LIMIT 1;
            
            UPDATE public.email_verification_codes 
            SET attempts = attempts + 1 
            WHERE UPPER(code) = UPPER($2) AND email = $1;
            
            IF code_record IS NULL THEN
                RETURN FALSE;
            END IF;
            
            UPDATE public.email_verification_codes 
            SET used_at = NOW() 
            WHERE id = code_record.id;
            
            UPDATE auth.users 
            SET email_confirmed_at = NOW()
            WHERE id = code_record.user_id
            AND email_confirmed_at IS NULL;
            
            UPDATE public.users 
            SET is_verified = true
            WHERE id = code_record.user_id;
            
            RETURN TRUE;
            
        EXCEPTION WHEN OTHERS THEN
            RETURN FALSE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;`,
        
        `ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;`,
        
        `CREATE POLICY "Allow service role full access to email_verification_codes" 
         ON public.email_verification_codes 
         FOR ALL 
         TO service_role 
         USING (true);`
      ];

      console.log('📝 SQL commands prepared. Please run these in Supabase SQL Editor:');
      console.log('='.repeat(60));
      sqlCommands.forEach((sql, index) => {
        console.log(`-- Command ${index + 1}:`);
        console.log(sql);
        console.log('');
      });
      console.log('='.repeat(60));
      
    } else {
      console.log('✅ Table already exists or accessible');
    }

  } catch (error) {
    console.error('❌ Direct execution failed:', error);
  }
}

// Run the migration
directExecution().catch(console.error);
