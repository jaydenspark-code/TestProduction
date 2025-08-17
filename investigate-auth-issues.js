// Database investigation and fix script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDA2NCwiZXhwIjoyMDY4NjcwMDY0fQ.vVJ6VIJe1sXG5F4w__k3f6YzP1SHTSdtO_MoHMHAO5Q'; // Service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateAuthIssues() {
  console.log('🔍 Investigating authentication and database issues...\n');

  const testUsers = [
    'ernest.debrah@bluecrest.edu.gh',
    'thearnest7@gmail.com'
  ];

  for (const email of testUsers) {
    console.log(`📧 Investigating: ${email}`);
    console.log('='.repeat(50));

    // 1. Check auth users table
    console.log('1️⃣ Checking auth.users...');
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, email_confirmed_at, created_at')
        .eq('email', email);

      if (authError) {
        console.log('⚠️ Cannot query auth.users directly (expected with service role)');
      } else {
        console.log('✅ Auth users found:', authUsers?.length || 0);
        authUsers?.forEach(user => {
          console.log(`   - ID: ${user.id}`);
          console.log(`   - Email: ${user.email}`);
          console.log(`   - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        });
      }
    } catch (error) {
      console.log('⚠️ Auth query error (expected):', error.message);
    }

    // 2. Check users table (our profile table)
    console.log('\n2️⃣ Checking users table...');
    const { data: profiles, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (profileError) {
      console.error('❌ Profile query error:', profileError);
    } else {
      console.log(`✅ Profiles found: ${profiles?.length || 0}`);
      profiles?.forEach((profile, index) => {
        console.log(`   Profile ${index + 1}:`);
        console.log(`   - ID: ${profile.id}`);
        console.log(`   - Email: ${profile.email}`);
        console.log(`   - Name: ${profile.fullName || profile.full_name}`);
        console.log(`   - Verified: ${profile.isVerified || profile.is_verified}`);
        console.log(`   - Paid: ${profile.isPaidUser || profile.is_paid}`);
        console.log(`   - Role: ${profile.role}`);
      });
    }

    // 3. Check for foreign key dependencies
    console.log('\n3️⃣ Checking foreign key dependencies...');
    const tables = [
      'user_privacy_settings',
      'referrals', 
      'earnings',
      'payments',
      'agent_applications'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('user_id')
          .eq('user_id', profiles?.[0]?.id);

        if (!error && data) {
          console.log(`   - ${table}: ${data.length} records`);
        }
      } catch (error) {
        // Table might not exist, that's ok
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');
  }

  // 4. Show recommended fixes
  console.log('🛠️ RECOMMENDED FIXES:');
  console.log('\nFor ernest.debrah@bluecrest.edu.gh:');
  console.log('- ❌ User does not exist in auth system');
  console.log('- 💡 Solution: Re-register this user or verify correct credentials');

  console.log('\nFor thearnest7@gmail.com:');
  console.log('- ⚠️ ID mismatch between auth and profile tables');
  console.log('- 💡 Solution: Update foreign key references or create new profile with correct ID');
}

// Run the investigation
investigateAuthIssues().catch(console.error);
