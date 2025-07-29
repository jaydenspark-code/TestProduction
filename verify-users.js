// Script to manually verify users and fix auth issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAllUsers() {
  console.log('🔧 Starting user verification process...');
  
  try {
    // Get all unverified users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, is_verified')
      .eq('is_verified', false);
    
    if (error) {
      console.error('❌ Failed to fetch users:', error.message);
      return;
    }

    console.log(`📋 Found ${users.length} unverified users`);

    // Update all users to verified status
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('is_verified', false);

    if (updateError) {
      console.error('❌ Failed to verify users:', updateError.message);
      return;
    }

    console.log('✅ All users have been verified successfully!');
    
    // Display updated users
    const { data: updatedUsers } = await supabase
      .from('users')
      .select('id, email, is_verified, created_at')
      .order('created_at', { ascending: false });

    console.log('👥 Updated users:', updatedUsers);

  } catch (err) {
    console.error('❌ Verification process failed:', err);
  }
}

verifyAllUsers().catch(console.error);
