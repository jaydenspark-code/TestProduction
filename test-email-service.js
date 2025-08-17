// Test the updated email service
console.log('🧪 Testing Email Service...\n');

// Simulate the email service functionality
const testEmailService = {
  SENDGRID_API_KEY: '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',
  FROM_EMAIL: 'noreply@earnpro.org',
  FROM_NAME: 'EarnPro Team',

  async sendTestEmail(email, name) {
    try {
      const verificationToken = Date.now().toString() + '-' + Math.random().toString(36).substring(2);
      const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      
      console.log('📧 Preparing to send email to:', email);
      console.log('🔗 Verification URL:', verificationUrl);

      const emailData = {
        personalizations: [{
          to: [{ email: email, name: name }],
          subject: '🔐 Verify Your EarnPro Account - Action Required'
        }],
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME
        },
        content: [{
          type: 'text/html',
          value: `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
              <h2>Verify Your EarnPro Account</h2>
              <p>Hi ${name}!</p>
              <p>Please click the button below to verify your email address:</p>
              <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Verify Email
              </a>
              <p>If the button doesn't work, copy this link: ${verificationUrl}</p>
            </div>
          `
        }]
      };

      console.log('📤 Sending email via SendGrid API...');
      
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok || response.status === 202) {
        console.log('✅ Email sent successfully!');
        console.log('📊 Response status:', response.status);
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send email:', response.status);
        console.error('Error details:', errorText);
        return { success: false, error: `SendGrid error: ${response.status}` };
      }
      
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// Test with a sample email
testEmailService.sendTestEmail('test@example.com', 'Test User')
  .then(result => {
    console.log('\n🎯 Test Result:', result);
    if (result.success) {
      console.log('🎉 Email service is working! Verification emails should now be sent during registration.');
    } else {
      console.log('⚠️ Email service has issues. Check the error above.');
    }
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
  });
