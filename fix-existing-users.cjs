// Fix script for existing verified users without auth users
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDA2NCwiZXhwIjoyMDY4NjcwMDY0fQ.gdjAQb72tWoSw2Rf-1llfIDUB7rLFPoGb85ml7676B4';

const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey);

async function fixExistingUsers() {
  console.log('🔧 Fixing existing verified users without auth users...');
  
  try {
    // Find verified users without auth_user_id
    const { data: usersToFix, error: fetchError } = await serviceRoleClient
      .from('users')
      .select('id, email, full_name')
      .eq('is_verified', true)
      .is('auth_user_id', null);
    
    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${usersToFix.length} users to fix:`);
    usersToFix.forEach(user => {
      console.log(`  - ${user.email} (${user.full_name})`);
    });
    
    for (const user of usersToFix) {
      console.log(`\n🔐 Creating auth user for: ${user.email}`);
      
      // Generate a default password for existing users
      const defaultPassword = 'EarnPro2025!';
      
      try {
        // Create user in Supabase auth system
        const { data: authUser, error: authError } = await serviceRoleClient.auth.admin.createUser({
          email: user.email,
          password: defaultPassword,
          email_confirm: true, // Skip email confirmation since they're already verified
          user_metadata: {
            full_name: user.full_name
          }
        });

        if (authError) {
          console.error(`❌ Failed to create auth user for ${user.email}:`, authError);
          continue;
        }

        console.log(`✅ Auth user created: ${authUser.user?.id}`);

        // Update the user record to link to the auth user
        const { error: updateError } = await serviceRoleClient
          .from('users')
          .update({ 
            auth_user_id: authUser.user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Failed to update user record for ${user.email}:`, updateError);
        } else {
          console.log(`✅ User record updated with auth_user_id`);
          console.log(`📧 User can now login with email: ${user.email} and password: ${defaultPassword}`);
        }

      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
      }
    }
    
    console.log('\n🎉 Fix complete! All existing verified users should now be able to log in.');
    console.log('📋 Default password for all fixed users: EarnPro2025!');
    console.log('💡 Users should change their password after logging in.');
    
  } catch (error) {
    console.error('❌ Fix script error:', error);
  }
}

fixExistingUsers();
