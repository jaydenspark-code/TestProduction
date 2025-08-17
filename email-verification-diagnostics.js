// Comprehensive Email Verification Diagnostics and Testing Script
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuration from .env file
const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';
const sendGridApiKey = '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';
const fromEmail = 'noreply@earnpro.org';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class EmailVerificationDiagnostics {
  
  async runDiagnostics() {
    console.log('🔍 Starting Email Verification Diagnostics...\n');
    
    // Test 1: Database Connection
    await this.testDatabaseConnection();
    
    // Test 2: Email Verifications Table
    await this.testEmailVerificationsTable();
    
    // Test 3: SendGrid Configuration
    await this.testSendGridConfiguration();
    
    // Test 4: SendGrid API Connectivity
    await this.testSendGridApi();
    
    // Test 5: Create Test Verification Token
    await this.testCreateVerificationToken();
    
    // Test 6: Send Test Email
    await this.sendTestEmail();
    
    console.log('\n✅ Diagnostics complete!');
  }
  
  async testDatabaseConnection() {
    console.log('1️⃣ Testing Database Connection...');
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        console.log('❌ Database connection failed:', error.message);
      } else {
        console.log('✅ Database connection successful');
      }
    } catch (err) {
      console.log('❌ Database connection error:', err.message);
    }
    console.log('');
  }
  
  async testEmailVerificationsTable() {
    console.log('2️⃣ Testing Email Verifications Table...');
    try {
      // Test table exists
      const { data, error } = await supabase
        .from('email_verifications')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ email_verifications table issue:', error.message);
        
        // Check if table needs to be created
        if (error.code === 'PGRST116') {
          console.log('⚠️ Table does not exist. Creating it...');
          await this.createEmailVerificationsTable();
        }
      } else {
        console.log('✅ email_verifications table accessible');
        
        // Show current verification records
        const { data: records } = await supabase
          .from('email_verifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        console.log(`📊 Current verification records: ${records?.length || 0}`);
        if (records && records.length > 0) {
          console.log('Recent records:', records.map(r => ({
            email: r.email,
            created: new Date(r.created_at).toLocaleString(),
            expires: new Date(r.expires_at).toLocaleString()
          })));
        }
      }
    } catch (err) {
      console.log('❌ Email verifications table error:', err.message);
    }
    console.log('');
  }
  
  async testSendGridConfiguration() {
    console.log('3️⃣ Testing SendGrid Configuration...');
    
    const hasApiKey = !!sendGridApiKey;
    const isValidKey = sendGridApiKey && sendGridApiKey !== 'your_sendgrid_api_key_here' && sendGridApiKey.startsWith('SG.');
    const hasFromEmail = !!fromEmail;
    
    console.log('📋 Configuration Status:');
    console.log(`   API Key: ${hasApiKey ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Valid Key: ${isValidKey ? '✅ Valid format' : '❌ Invalid format'}`);
    console.log(`   From Email: ${hasFromEmail ? '✅ Present' : '❌ Missing'}`);
    console.log(`   From Email Value: ${fromEmail}`);
    
    if (hasApiKey && isValidKey && hasFromEmail) {
      console.log('✅ SendGrid configuration looks good');
    } else {
      console.log('❌ SendGrid configuration has issues');
    }
    console.log('');
  }
  
  async testSendGridApi() {
    console.log('4️⃣ Testing SendGrid API Connectivity...');
    
    try {
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const profile = await response.json();
        console.log('✅ SendGrid API connection successful');
        console.log(`📧 Account: ${profile.username || profile.email || 'Unknown'}`);
      } else {
        const errorText = await response.text();
        console.log('❌ SendGrid API connection failed:', response.status, response.statusText);
        console.log('Error details:', errorText);
      }
    } catch (err) {
      console.log('❌ SendGrid API connection error:', err.message);
    }
    console.log('');
  }
  
  async testCreateVerificationToken() {
    console.log('5️⃣ Testing Verification Token Creation...');
    
    try {
      const testUserId = 'test-user-id';
      const testEmail = 'test@example.com';
      const testToken = this.generateVerificationToken();
      
      console.log('📝 Generated token:', testToken.substring(0, 20) + '...');
      
      // Try to store the token
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const { error } = await supabase
        .from('email_verifications')
        .insert({
          user_id: testUserId,
          email: testEmail,
          token: testToken,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.log('❌ Token storage failed:', error.message);
      } else {
        console.log('✅ Token stored successfully');
        
        // Clean up test token
        await supabase
          .from('email_verifications')
          .delete()
          .eq('token', testToken);
        console.log('🧹 Test token cleaned up');
      }
    } catch (err) {
      console.log('❌ Token creation error:', err.message);
    }
    console.log('');
  }
  
  async sendTestEmail() {
    console.log('6️⃣ Testing Email Sending...');
    
    try {
      const testEmail = {
        personalizations: [{
          to: [{ email: 'test-recipient@example.com' }],
          subject: 'EarnPro Email Verification Test'
        }],
        from: {
          email: fromEmail,
          name: 'EarnPro Test'
        },
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #667eea;">📧 Email Verification Test</h2>
              <p>This is a test email to verify that SendGrid is working properly.</p>
              <p><strong>Test performed at:</strong> ${new Date().toLocaleString()}</p>
              <p style="color: #666; font-size: 12px;">This is an automated test email from EarnPro diagnostics.</p>
            </div>
          `
        }]
      };
      
      console.log('📤 Attempting to send test email via SendGrid...');
      
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testEmail)
      });
      
      if (response.ok || response.status === 202) {
        console.log('✅ Test email sent successfully');
        console.log('📮 Email sent to: test-recipient@example.com');
        console.log('💡 Note: This is a test email - it may not actually deliver');
      } else {
        const errorText = await response.text();
        console.log('❌ Email sending failed:', response.status, response.statusText);
        console.log('Error details:', errorText);
      }
    } catch (err) {
      console.log('❌ Email sending error:', err.message);
    }
    console.log('');
  }
  
  generateVerificationToken() {
    const timestamp = Date.now().toString();
    const randomBytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
    const randomString = randomBytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return `${timestamp}-${randomString}`;
  }
  
  async createEmailVerificationsTable() {
    console.log('🛠️ Creating email_verifications table...');
    
    // This would require service role permissions, so we'll just log what needs to be done
    console.log('❗ Manual Action Required:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run the SQL script from database_schema_email_verification.sql');
    console.log('   4. Re-run this diagnostic script');
  }
  
  async fixExistingUsers() {
    console.log('🔧 Checking for users needing email verification...');
    
    try {
      const { data: unverifiedUsers, error } = await supabase
        .from('users')
        .select('id, email, full_name, is_verified')
        .eq('is_verified', false);
      
      if (error) {
        console.log('❌ Error fetching unverified users:', error.message);
        return;
      }
      
      console.log(`📊 Found ${unverifiedUsers.length} unverified users`);
      
      if (unverifiedUsers.length > 0) {
        console.log('Users needing verification:');
        unverifiedUsers.forEach(user => {
          console.log(`   - ${user.email} (${user.full_name})`);
        });
        
        console.log('\n💡 To send verification emails to these users:');
        console.log('   1. Make sure SendGrid is properly configured');
        console.log('   2. Use the resend verification email function in the app');
        console.log('   3. Or manually verify them using verify-users.js script');
      }
    } catch (err) {
      console.log('❌ Error checking users:', err.message);
    }
  }
}

// Run diagnostics
async function main() {
  const diagnostics = new EmailVerificationDiagnostics();
  await diagnostics.runDiagnostics();
  await diagnostics.fixExistingUsers();
}

main().catch(console.error);
