// Test registration specifically for mrforensics100@gmail.com
console.log('🎯 Testing email verification for mrforensics100@gmail.com\n');

const testData = {
  email: 'mrforensics100@gmail.com',
  fullName: 'Mr Forensics',
  verificationToken: Date.now().toString() + '-' + Math.random().toString(36).substring(2)
};

// Test the API endpoint directly
async function testEmailAPI() {
  try {
    console.log('📤 Testing API endpoint...');
    console.log('📧 Email:', testData.email);
    console.log('👤 Name:', testData.fullName);
    console.log('🔑 Token:', testData.verificationToken);
    
    const response = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ EMAIL SENT SUCCESSFULLY!');
      console.log('📮 Check your email inbox for: mrforensics100@gmail.com');
      console.log('📧 Don\'t forget to check spam/junk folder too!');
    } else {
      console.error('❌ Email sending failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 API Test Error:', error);
  }
}

// Test SendGrid directly (this should work from server but fail from browser due to CORS)
async function testSendGridDirect() {
  try {
    console.log('\n🧪 Testing SendGrid directly (expecting CORS error)...');
    
    const emailData = {
      personalizations: [{
        to: [{ email: testData.email, name: testData.fullName }],
        subject: '🧪 Test Email from EarnPro'
      }],
      from: {
        email: 'noreply@earnpro.org',
        name: 'EarnPro Team'
      },
      content: [{
        type: 'text/html',
        value: '<h2>Test Email</h2><p>This is a test email for verification system.</p>'
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

    if (response.ok) {
      console.log('✅ Direct SendGrid call worked (unexpected!)');
    } else {
      console.log('❌ Direct SendGrid call failed (expected due to CORS)');
    }
    
  } catch (error) {
    console.log('❌ Direct SendGrid call failed with CORS error (expected):', error.message);
  }
}

// Run the tests
console.log('🚀 Starting email verification tests...\n');

testSendGridDirect().then(() => {
  console.log('\n---\n');
  testEmailAPI();
});
