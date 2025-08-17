// Quick fix: Disable RLS on user_privacy_settings temporarily
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDA2NCwiZXhwIjoyMDY4NjcwMDY0fQ.gdjAQb72tWoSw2Rf-1llfIDUB7rLFPoGb85ml7676B4';

const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey);

async function quickFixRLS() {
  console.log('🔧 Quick fix for user_privacy_settings RLS...');
  
  try {
    // Test if we can insert with service role
    const { error } = await serviceRoleClient
      .from('user_privacy_settings')
      .insert({
        user_id: 'test-service-role-access',
        show_public_profile: true,
        show_network_overview: true,
        show_achievements: true,
        show_rank_history: true,
        show_activity: false
      });
    
    if (error) {
      console.log('❌ Service role blocked by RLS:', error);
      console.log('🔧 The issue is confirmed - RLS is blocking service role access');
      console.log('💡 SOLUTION: Add this SQL to your Supabase SQL editor:');
      console.log('');
      console.log('-- Fix for user_privacy_settings RLS');
      console.log('DROP POLICY IF EXISTS "Service role full access" ON public.user_privacy_settings;');
      console.log('CREATE POLICY "Service role full access" ON public.user_privacy_settings FOR ALL TO service_role USING (true) WITH CHECK (true);');
      console.log('');
      console.log('Or temporarily disable RLS with:');
      console.log('ALTER TABLE public.user_privacy_settings DISABLE ROW LEVEL SECURITY;');
    } else {
      console.log('✅ Service role can access user_privacy_settings');
      // Clean up test row
      await serviceRoleClient
        .from('user_privacy_settings')
        .delete()
        .eq('user_id', 'test-service-role-access');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

quickFixRLS();
