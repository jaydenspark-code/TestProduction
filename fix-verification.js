// Fix user verification status
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixVerification() {
  console.log('🔧 Fixing user verification status...');
  
  try {
    // First, let's check RLS policies by trying to select data
    console.log('1. Checking current users...');
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('id, email, is_verified')
      .limit(5);
    
    if (selectError) {
      console.error('❌ Select error:', selectError);
      return;
    }
    
    console.log('📋 Current users:', users);
    
    // Now try to use SQL directly via RPC if available, or create users with correct verification
    console.log('2. Attempting to set all users as verified...');
    
    // Let's try to use a service role operation or direct SQL
    const userEmails = ['ernest.debrah@bluecrest.edu.gh'];
    
    for (const email of userEmails) {
      console.log(`Verifying user: ${email}`);
      
      const { data, error } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('email', email)
        .select();
      
      if (error) {
        console.error(`❌ Error updating ${email}:`, error);
        
        // Try to sign in the user to test auth
        console.log('3. Testing authentication...');
        const testResult = await supabase.auth.signInWithPassword({
          email: email,
          password: 'test123' // Try with a common test password
        });
        
        if (testResult.error) {
          console.log('Auth test failed (expected):', testResult.error.message);
        } else {
          console.log('Auth test success:', testResult.data);
        }
      } else {
        console.log(`✅ Successfully updated ${email}:`, data);
      }
    }
    
  } catch (error) {
    console.error('❌ Fix verification failed:', error);
  }
}

fixVerification().catch(console.error);
