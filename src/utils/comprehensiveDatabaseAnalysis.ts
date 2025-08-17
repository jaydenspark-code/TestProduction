// Comprehensive Database Analysis and Google OAuth Access Script
import { supabase } from '../lib/supabase';

// 1. List all available tables in the database
const listAllTables = async () => {
  console.log('📋 Listing all available tables in the database...');
  
  try {
    // Query to get all tables in public schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.error('❌ Error fetching tables:', error);
      return { success: false, error: error.message };
    }

    console.log('📊 Found tables:');
    tables?.forEach((table: any, index: number) => {
      console.log(`${index + 1}. ${table.table_name} (${table.table_type})`);
    });

    return { success: true, tables };

  } catch (error: any) {
    console.error('❌ Error listing tables:', error);
    return { success: false, error: error.message };
  }
};

// 2. Check RLS policies on all tables
const checkAllRLSPolicies = async () => {
  console.log('🔍 Checking RLS policies on all tables...');
  
  try {
    // This query needs to be run with elevated permissions
    const sqlQuery = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;

    // Note: This might not work from frontend due to permissions
    console.log('📋 RLS Policy Query (run this in Supabase SQL Editor):');
    console.log(sqlQuery);

    return { success: true, query: sqlQuery };

  } catch (error: any) {
    console.error('❌ Error checking RLS policies:', error);
    return { success: false, error: error.message };
  }
};

// 3. Generate SQL to grant Google OAuth users access to all tables
const generateGrantAllAccessSQL = () => {
  console.log('🔧 Generating SQL to grant Google OAuth users access to all tables...');
  
  const sql = `
-- COMPREHENSIVE GOOGLE OAUTH ACCESS FIX
-- This script grants Google OAuth users proper access to all tables

BEGIN;

-- ============= STEP 1: DISABLE RLS ON ALL TABLES TEMPORARILY =============
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP 
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY;';
        RAISE NOTICE 'Disabled RLS on %', r.tablename;
    END LOOP; 
END $$;

-- ============= STEP 2: DROP ALL EXISTING CONFLICTING POLICIES =============
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || pol.schemaname || '.' || quote_ident(pol.tablename) || ';';
        RAISE NOTICE 'Dropped policy % on %', pol.policyname, pol.tablename;
    END LOOP; 
END $$;

-- ============= STEP 3: CREATE UNIVERSAL POLICIES FOR ALL TABLES =============

-- Create policies for users table (most critical)
CREATE POLICY "oauth_users_full_access" ON public.users
    FOR ALL 
    USING (auth.uid() = id OR true)  -- Allow public read for referrals
    WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Create policies for user-related tables
DO $$ 
DECLARE 
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'user_privacy_settings',
        'user_sessions', 
        'user_achievements',
        'user_activities',
        'user_activity_log',
        'user_rank_history',
        'user_rankings',
        'user_reviews',
        'user_badges',
        'withdrawal_requests',
        'transactions',
        'agent_applications',
        'advertiser_applications',
        'referrals',
        'notifications',
        'payments'
    ];
BEGIN 
    FOREACH table_name IN ARRAY tables
    LOOP
        -- Check if table exists first
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            -- Create user access policy
            EXECUTE 'CREATE POLICY "user_access_' || table_name || '" ON public.' || quote_ident(table_name) || 
                    ' FOR ALL USING (auth.uid() = user_id OR auth.uid()::text = user_id::text OR auth.role() = ''service_role'') ' ||
                    ' WITH CHECK (auth.uid() = user_id OR auth.uid()::text = user_id::text OR auth.role() = ''service_role'');';
            
            RAISE NOTICE 'Created user access policy for %', table_name;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', table_name;
        END IF;
    END LOOP; 
END $$;

-- ============= STEP 4: CREATE SERVICE ROLE BYPASS POLICIES =============
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP 
        EXECUTE 'CREATE POLICY "service_role_bypass_' || r.tablename || '" ON public.' || quote_ident(r.tablename) || 
                ' FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'');';
        RAISE NOTICE 'Created service role bypass for %', r.tablename;
    END LOOP; 
END $$;

-- ============= STEP 5: RE-ENABLE RLS ON ALL TABLES =============
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP 
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
        RAISE NOTICE 'Re-enabled RLS on %', r.tablename;
    END LOOP; 
END $$;

-- ============= STEP 6: VERIFY SETUP =============
SELECT 'SUCCESS: Universal Google OAuth access configured!' as status;

-- Show all policies created
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

COMMIT;
  `;

  console.log('📋 Generated SQL for universal Google OAuth access:');
  console.log(sql);
  
  return sql;
};

// 4. Diagnostic function to check current user access
const diagnoseCurrentUserAccess = async () => {
  console.log('🔍 Diagnosing current user access...');
  
  try {
    // Get current session
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session.session?.user) {
      console.log('❌ No active session');
      return { success: false, error: 'No active session' };
    }

    const user = session.session.user;
    console.log('👤 Current user:', {
      id: user.id,
      email: user.email,
      provider: user.app_metadata?.provider
    });

    // Test access to users table
    console.log('🧪 Testing users table access...');
    
    // Try to read users table
    const { data: usersRead, error: readError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('📖 Read test result:', { success: !readError, data: usersRead, error: readError });

    // Try to insert/upsert user
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Google User',
      is_verified: true,
      is_paid: false,
      country: 'US',
      currency: 'USD',
      role: 'user',
      referral_code: 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      updated_at: new Date().toISOString()
    };

    console.log('✏️ Testing user creation with data:', userData);

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .upsert([userData], { onConflict: ['id'] })
      .select()
      .single();

    console.log('✏️ Insert/Upsert test result:', { 
      success: !insertError, 
      data: insertData, 
      error: insertError 
    });

    return {
      success: true,
      currentUser: user,
      readTest: { success: !readError, error: readError },
      writeTest: { success: !insertError, error: insertError }
    };

  } catch (error: any) {
    console.error('❌ Diagnosis error:', error);
    return { success: false, error: error.message };
  }
};

// Export for console access
if (typeof window !== 'undefined') {
  (window as any).listAllTables = listAllTables;
  (window as any).checkAllRLSPolicies = checkAllRLSPolicies;
  (window as any).generateGrantAllAccessSQL = generateGrantAllAccessSQL;
  (window as any).diagnoseCurrentUserAccess = diagnoseCurrentUserAccess;
}

export { listAllTables, checkAllRLSPolicies, generateGrantAllAccessSQL, diagnoseCurrentUserAccess };
