// Debug script to check authentication and database issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAuth() {
  console.log('🔍 Starting authentication debug...');
  
  // 1. Test basic connection
  try {
    const { data, error } = await supabase.from('users').select('count');
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    console.log('✅ Database connection successful');
  } catch (err) {
    console.error('❌ Connection error:', err);
    return;
  }

  // 2. Check current auth session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Session check failed:', error.message);
    } else {
      console.log('📝 Current session:', session ? 'Active' : 'None');
    }
  } catch (err) {
    console.error('❌ Session error:', err);
  }

  // 3. List recent users in database
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, is_verified, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Users query failed:', error.message);
    } else {
      console.log('👥 Recent users:', users);
    }
  } catch (err) {
    console.error('❌ Users query error:', err);
  }

  // 4. Test email confirmation settings
  try {
    console.log('📧 Email confirmation required for signup');
    console.log('   - Users will receive verification emails');
    console.log('   - Check your Supabase Auth settings');
    console.log('   - Verify SMTP configuration in Supabase dashboard');
  } catch (err) {
    console.error('❌ Auth config error:', err);
  }
}

debugAuth().catch(console.error);
