// Test script to register a new user and check the flow
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDA2NCwiZXhwIjoyMDY4NjcwMDY0fQ.gdjAQb72tWoSw2Rf-1llfIDUB7rLFPoGb85ml7676B4';

const supabase = createClient(supabaseUrl, supabaseKey);
const serviceRoleClient = createClient(supabaseUrl, serviceRoleKey);

async function testRegistrationFlow() {
  console.log('🔍 Testing registration and verification flow...');
  
  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testFullName = 'Test User';
  
  try {
    console.log(`📝 Creating test user: ${testEmail}`);
    
    // Step 1: Create user record (simulating registration)
    const userId = crypto.randomUUID();
    const referralCode = 'EP' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: newUser, error: createError } = await serviceRoleClient
      .from('users')
      .insert({
        id: userId,
        email: testEmail,
        full_name: testFullName,
        country: 'US',
        currency: 'USD',
        referral_code: referralCode,
        is_verified: false,
        is_paid: false,
        role: 'user',
        temp_password: testPassword, // Store password temporarily
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create user:', createError);
      return;
    }
    
    console.log('✅ User created:', newUser);
    
    // Step 2: Create verification code
    const verificationCode = 'TEST12';
    const { error: codeError } = await serviceRoleClient
      .from('email_verification_codes')
      .insert({
        user_id: userId,
        email: testEmail,
        code: verificationCode,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        attempts: 0
      });
    
    if (codeError) {
      console.error('❌ Failed to create verification code:', codeError);
      return;
    }
    
    console.log('✅ Verification code created:', verificationCode);
    
    // Step 3: Test verification function
    console.log('🔐 Testing verification function...');
    const { data: verifyResult, error: verifyError } = await supabase
      .rpc('verify_email_code', {
        verification_code: verificationCode
      });
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
      return;
    }
    
    console.log('✅ Verification result:', verifyResult);
    
    // Step 4: Check user data after verification
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, is_verified, temp_password, auth_user_id')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ Error fetching user data:', userError);
      return;
    }
    
    console.log('📊 User data after verification:', userData);
    
    // Step 5: Test Edge Function if temp_password exists
    if (userData.temp_password) {
      console.log('🚀 Testing Edge Function...');
      
      const { data: authResult, error: authError } = await supabase.functions.invoke('create-auth-user-after-verification', {
        body: {
          email: userData.email,
          password: userData.temp_password,
          fullName: userData.full_name,
          userId: userData.id
        }
      });
      
      if (authError) {
        console.error('❌ Edge Function error:', authError);
      } else {
        console.log('✅ Edge Function result:', authResult);
      }
      
      // Check user data after auth creation
      const { data: finalUserData, error: finalUserError } = await supabase
        .from('users')
        .select('id, email, full_name, is_verified, temp_password, auth_user_id')
        .eq('id', userId)
        .single();
      
      console.log('📊 Final user data:', finalUserData);
    } else {
      console.log('⚠️ No temp_password found - cannot test auth creation');
    }
    
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await serviceRoleClient.from('users').delete().eq('id', userId);
    await serviceRoleClient.from('email_verification_codes').delete().eq('user_id', userId);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testRegistrationFlow();
