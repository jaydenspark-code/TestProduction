/**
 * Clean up specific problematic users for registration testing
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bmtaqilpuszwoshtizmq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDA2NCwiZXhwIjoyMDY4NjcwMDY0fQ.gdjAQb72tWoSw2Rf-1llfIDUB7rLFPoGb85ml7676B4'
);

async function cleanupSpecificUser() {
  console.log('🧹 Cleaning up problematic user: cornerston66@gmail.com');
  
  const problemEmail = 'cornerston66@gmail.com';
  
  try {
    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', problemEmail)
      .single();
    
    if (findError && findError.code !== 'PGRST116') {
      console.error(`❌ Error finding user ${problemEmail}:`, findError);
      return;
    }
    
    if (!user) {
      console.log(`✅ User ${problemEmail} does not exist - no cleanup needed`);
      return;
    }
    
    console.log(`🗑️ Found user ${problemEmail} with ID ${user.id} - removing...`);
    
    // Delete privacy settings first (foreign key constraint)
    const { error: privacyError } = await supabase
      .from('user_privacy_settings')
      .delete()
      .eq('user_id', user.id);
    
    if (privacyError) {
      console.warn(`⚠️ Could not delete privacy settings for ${problemEmail}:`, privacyError);
    } else {
      console.log(`✅ Privacy settings deleted for ${problemEmail}`);
    }
    
    // Delete any verification codes
    const { error: verificationError } = await supabase
      .from('email_verification_codes')
      .delete()
      .eq('email', problemEmail);
    
    if (verificationError) {
      console.warn(`⚠️ Could not delete verification codes for ${problemEmail}:`, verificationError);
    } else {
      console.log(`✅ Verification codes deleted for ${problemEmail}`);
    }
    
    // Delete user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);
    
    if (deleteError) {
      console.error(`❌ Could not delete user ${problemEmail}:`, deleteError);
    } else {
      console.log(`✅ Successfully deleted user ${problemEmail}`);
    }
    
    // Verify user is gone
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', problemEmail)
      .single();
    
    if (verifyError && verifyError.code === 'PGRST116') {
      console.log(`✅ Confirmed: User ${problemEmail} has been completely removed`);
    } else if (verifyUser) {
      console.error(`❌ User ${problemEmail} still exists!`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
  
  console.log('🧹 Cleanup complete!');
}

// Run cleanup
cleanupSpecificUser().catch(console.error);
