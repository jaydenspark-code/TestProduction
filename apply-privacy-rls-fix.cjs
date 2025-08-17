// Apply RLS fix for user_privacy_settings
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDA2NCwiZXhwIjoyMDY4NjcwMDY0fQ.gdjAQb72tWoSw2Rf-1llfIDUB7rLFPoGb85ml7676B4';

const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey);

async function fixPrivacySettingsRLS() {
  console.log('🔧 Fixing RLS policies for user_privacy_settings...');
  
  const sqlCommands = [
    // Drop existing policies
    `DROP POLICY IF EXISTS "Users can view their own privacy settings" ON public.user_privacy_settings;`,
    `DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.user_privacy_settings;`,
    `DROP POLICY IF EXISTS "Users can insert their own privacy settings" ON public.user_privacy_settings;`,
    `DROP POLICY IF EXISTS "Service role can manage all privacy settings" ON public.user_privacy_settings;`,
    `DROP POLICY IF EXISTS "Allow privacy settings creation during registration" ON public.user_privacy_settings;`,
    
    // Create new policies
    `CREATE POLICY "Service role can manage all privacy settings" 
     ON public.user_privacy_settings FOR ALL TO service_role 
     USING (true) WITH CHECK (true);`,
     
    `CREATE POLICY "Users can view their own privacy settings" 
     ON public.user_privacy_settings FOR SELECT TO authenticated 
     USING (auth.uid()::text = user_id OR auth.uid() = user_id::uuid);`,
     
    `CREATE POLICY "Users can update their own privacy settings" 
     ON public.user_privacy_settings FOR UPDATE TO authenticated 
     USING (auth.uid()::text = user_id OR auth.uid() = user_id::uuid) 
     WITH CHECK (auth.uid()::text = user_id OR auth.uid() = user_id::uuid);`,
     
    `CREATE POLICY "Allow privacy settings creation during registration" 
     ON public.user_privacy_settings FOR INSERT TO anon WITH CHECK (true);`,
     
    // Grant permissions
    `GRANT ALL ON public.user_privacy_settings TO service_role;`,
    `GRANT SELECT, INSERT, UPDATE ON public.user_privacy_settings TO authenticated;`,
    `GRANT INSERT ON public.user_privacy_settings TO anon;`
  ];
  
  for (const sql of sqlCommands) {
    try {
      console.log('Executing:', sql.substring(0, 50) + '...');
      const { error } = await serviceRoleClient.rpc('exec_sql', { query: sql });
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('✅ Success');
      }
    } catch (error) {
      console.error('Error executing SQL:', error);
    }
  }
  
  console.log('🎉 RLS fix complete!');
}

fixPrivacySettingsRLS();
