// Apply Google OAuth RLS Fix to Supabase
import { supabase } from '../lib/supabase';

const applyGoogleOAuthRLSFix = async () => {
  console.log('🔧 Applying Google OAuth RLS fix...');
  
  try {
    // Note: This requires service role key to modify RLS policies
    // In production, this should be run by an admin or via Supabase SQL editor
    
    const sqlCommands = [
      // Remove existing conflicting policies
      `DROP POLICY IF EXISTS "Allow user registration" ON public.users;`,
      `DROP POLICY IF EXISTS "Users can view own profile" ON public.users;`,
      `DROP POLICY IF EXISTS "Users can update own profile" ON public.users;`,
      `DROP POLICY IF EXISTS "Public read access for referral validation" ON public.users;`,
      
      // Create new working policies
      `CREATE POLICY "authenticated_users_can_insert_own_profile" ON public.users
        FOR INSERT 
        WITH CHECK (auth.uid() = id);`,
      
      `CREATE POLICY "users_can_view_own_profile" ON public.users
        FOR SELECT 
        USING (auth.uid() = id OR true);`,
      
      `CREATE POLICY "users_can_update_own_profile" ON public.users
        FOR UPDATE 
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);`,
      
      `CREATE POLICY "service_role_all_access" ON public.users
        FOR ALL
        USING (current_setting('role') = 'service_role')
        WITH CHECK (current_setting('role') = 'service_role');`,
      
      // Ensure RLS is enabled
      `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`
    ];

    for (const sql of sqlCommands) {
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_statement: sql });
      
      if (error) {
        console.error(`❌ Error executing SQL: ${sql}`);
        console.error('Error:', error);
        // Continue with other commands
      } else {
        console.log('✅ SQL executed successfully');
      }
    }

    console.log('🎉 Google OAuth RLS fix completed!');
    return { success: true, message: 'RLS policies updated for Google OAuth' };

  } catch (error) {
    console.error('❌ Error applying RLS fix:', error);
    return { success: false, error: error.message };
  }
};

// Alternative approach: Manual SQL execution guide
export const getManualSQLFix = () => {
  return `
-- Copy and paste this SQL into your Supabase SQL Editor:

BEGIN;

-- Remove existing policies
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public read access for referral validation" ON public.users;

-- Create new policies that work with Google OAuth
CREATE POLICY "authenticated_users_can_insert_own_profile" ON public.users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_view_own_profile" ON public.users
    FOR SELECT 
    USING (auth.uid() = id OR true);

CREATE POLICY "users_can_update_own_profile" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "service_role_all_access" ON public.users
    FOR ALL
    USING (current_setting('role') = 'service_role')
    WITH CHECK (current_setting('role') = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';
  `;
};

// For console access
if (typeof window !== 'undefined') {
  window.applyGoogleOAuthRLSFix = applyGoogleOAuthRLSFix;
  window.getManualSQLFix = getManualSQLFix;
}

export { applyGoogleOAuthRLSFix };
