// Comprehensive Supabase Email Verification Fix
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Important: Don't persist session for testing
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
});

class SupabaseEmailFix {
  
  async diagnoseIssue() {
    console.log('🔍 DIAGNOSING SUPABASE EMAIL VERIFICATION ISSUE');
    console.log('================================================\n');
    
    // Step 1: Test current signup behavior
    console.log('📝 Step 1: Testing current signup behavior...');
    
    const testEmail = `test-diagnosis-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      // Clear any existing session first
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: 'http://localhost:5173/verify-email'
        }
      });

      if (error) {
        console.error('❌ Signup failed:', error.message);
        return false;
      }

      console.log('✅ Signup successful');
      console.log('📧 User created:', !!data.user);
      console.log('🔐 Session created:', !!data.session);
      console.log('📧 Email confirmed at:', data.user?.email_confirmed_at || 'NOT CONFIRMED');
      
      if (data.session) {
        console.log('❌ ISSUE CONFIRMED: User was auto-logged in without email verification');
        console.log('   This means Supabase email confirmation is effectively disabled');
        return false;
      } else {
        console.log('✅ CORRECT: No session created, email verification required');
        return true;
      }
      
    } catch (error) {
      console.error('💥 Signup test failed:', error);
      return false;
    }
  }
  
  async checkSupabaseSettings() {
    console.log('\n🔧 Step 2: Checking Supabase configuration...');
    
    // We can't directly check Supabase settings via API, but we can infer from behavior
    console.log('⚠️  Cannot directly check Supabase settings via API');
    console.log('📋 Manual checks required in Supabase Dashboard:');
    console.log('   1. Go to Authentication → Settings');
    console.log('   2. Ensure "Enable email confirmations" is ON');
    console.log('   3. Check Site URL is correct: http://localhost:5173');
    console.log('   4. Check Email Templates are enabled');
    console.log('   5. MOST IMPORTANT: Configure SMTP settings');
    
    return true;
  }
  
  async testCustomEmailVerification() {
    console.log('\n📧 Step 3: Testing custom email verification system...');
    
    // This will test our custom email verification as a fallback
    try {
      const testUser = {
        id: 'test-user-' + Date.now(),
        email: `custom-test-${Date.now()}@example.com`,
        name: 'Test User'
      };
      
      // Generate verification token
      const token = this.generateVerificationToken();
      console.log('🔑 Generated verification token:', token.substring(0, 20) + '...');
      
      // Test email sending via SendGrid
      const emailSent = await this.sendCustomVerificationEmail(testUser.email, testUser.name, token);
      
      if (emailSent) {
        console.log('✅ Custom email verification system working');
        return true;
      } else {
        console.log('❌ Custom email verification failed');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Custom email verification test failed:', error);
      return false;
    }
  }
  
  async implementWorkaround() {
    console.log('\n🛠️  Step 4: Implementing email verification workaround...');
    
    console.log('📋 RECOMMENDED SOLUTIONS:');
    console.log('========================');
    
    console.log('\n🥇 OPTION 1: Fix Supabase SMTP (RECOMMENDED)');
    console.log('   1. Go to Supabase Dashboard → Authentication → Settings');
    console.log('   2. Scroll to "SMTP Settings"');
    console.log('   3. Configure with these settings:');
    console.log('      Host: smtp.sendgrid.net');
    console.log('      Port: 587 (or 465 for SSL)');
    console.log('      Username: apikey');
    console.log('      Password: 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');
    console.log('      Sender Name: EarnPro');
    console.log('      Sender Email: noreply@earnpro.org');
    
    console.log('\n🥈 OPTION 2: Use Custom Email Verification');
    console.log('   - Modify registration flow to use our custom system');
    console.log('   - Disable Supabase email confirmation temporarily');
    console.log('   - Handle verification in application code');
    
    console.log('\n🥉 OPTION 3: Temporary Manual Verification');
    console.log('   - Disable email confirmation for development');
    console.log('   - Auto-verify users for testing');
    console.log('   - Enable proper verification before production');
    
    return true;
  }
  
  generateVerificationToken() {
    const timestamp = Date.now().toString();
    const randomBytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
    const randomString = randomBytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return `${timestamp}-${randomString}`;
  }
  
  async sendCustomVerificationEmail(email, name, token) {
    try {
      const verificationUrl = `http://localhost:5173/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
      
      const emailData = {
        personalizations: [{
          to: [{ email: email, name: name }],
          subject: 'Verify Your EarnPro Account'
        }],
        from: {
          email: 'noreply@earnpro.org',
          name: 'EarnPro Team'
        },
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #667eea; margin-bottom: 10px;">EarnPro</h1>
                <p style="color: #666; font-size: 16px;">Multi-Level Referral System</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0;">Verify Your Email Address</h2>
                <p style="margin: 0; opacity: 0.9;">Click the button below to verify your email and complete your registration</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold; 
                          display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 10px 0;">
                  ${verificationUrl}
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This email was sent by EarnPro. If you didn't create an account, please ignore this email.
                </p>
              </div>
            </div>
          `
        }]
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok || response.status === 202) {
        console.log('✅ Custom verification email sent successfully');
        console.log('📧 Email sent to:', email);
        console.log('🔗 Verification URL:', verificationUrl);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send email:', response.status, errorText);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error sending custom verification email:', error);
      return false;
    }
  }
  
  async fixExistingUsers() {
    console.log('\n👥 Step 5: Checking existing unverified users...');
    
    try {
      const { data: unverifiedUsers, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('is_verified', false)
        .limit(5); // Just show first 5 for demo
      
      if (error) {
        console.error('❌ Error fetching users:', error.message);
        return false;
      }
      
      console.log(`📊 Found ${unverifiedUsers.length} unverified users (showing first 5):`);
      
      if (unverifiedUsers.length > 0) {
        unverifiedUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.full_name || 'No name'})`);
        });
        
        console.log('\n💡 Options for existing users:');
        console.log('   1. Send custom verification emails');
        console.log('   2. Manually verify for testing');
        console.log('   3. Wait for proper Supabase SMTP configuration');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error checking existing users:', error);
      return false;
    }
  }
  
  async runCompleteDiagnosis() {
    console.log('🚀 STARTING COMPLETE EMAIL VERIFICATION DIAGNOSIS');
    console.log('=================================================\n');
    
    const results = {
      signupTest: await this.diagnoseIssue(),
      settingsCheck: await this.checkSupabaseSettings(),
      customEmailTest: await this.testCustomEmailVerification(),
      workaroundOptions: await this.implementWorkaround(),
      existingUsersCheck: await this.fixExistingUsers()
    };
    
    console.log('\n📊 DIAGNOSIS SUMMARY');
    console.log('===================');
    console.log('Signup Test:', results.signupTest ? '✅ Working' : '❌ Issue Found');
    console.log('Settings Check:', results.settingsCheck ? '✅ Complete' : '❌ Failed');
    console.log('Custom Email Test:', results.customEmailTest ? '✅ Working' : '❌ Failed');
    console.log('Workaround Options:', results.workaroundOptions ? '✅ Available' : '❌ None');
    console.log('Existing Users:', results.existingUsersCheck ? '✅ Checked' : '❌ Failed');
    
    console.log('\n🎯 NEXT ACTIONS:');
    console.log('===============');
    
    if (!results.signupTest) {
      console.log('1. 🔧 Configure SMTP in Supabase Dashboard (CRITICAL)');
      console.log('2. 🧪 Test signup after SMTP configuration');
      console.log('3. 📧 Send verification emails to existing users');
    } else {
      console.log('1. ✅ Email verification is working correctly');
      console.log('2. 📧 Consider sending emails to existing unverified users');
    }
    
    return results;
  }
}

// Run the complete diagnosis
const emailFix = new SupabaseEmailFix();
emailFix.runCompleteDiagnosis().catch(console.error);
