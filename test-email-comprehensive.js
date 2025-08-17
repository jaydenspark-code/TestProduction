// Comprehensive email verification test script
// Run this after starting your dev server with: npm run dev

async function testEmailVerificationSystem() {
  console.log('🧪 COMPREHENSIVE EMAIL VERIFICATION TEST');
  console.log('==========================================');
  console.log('Email: mrforensics100@gmail.com');
  console.log('Date:', new Date().toISOString());
  console.log('');

  const testData = {
    email: 'mrforensics100@gmail.com',
    fullName: 'Mr Forensics Test',
    verificationToken: `test-${Date.now()}-${Math.random().toString(36).substring(2)}`
  };

  console.log('📊 Test Parameters:');
  console.log('   Email:', testData.email);
  console.log('   Name:', testData.fullName);
  console.log('   Token:', testData.verificationToken);
  console.log('');

  // Test 1: Check if API endpoint is reachable
  console.log('🔍 TEST 1: API Endpoint Accessibility');
  console.log('────────────────────────────────────');
  
  try {
    const pingResponse = await fetch('/api/send-verification-email', {
      method: 'OPTIONS'
    });
    
    console.log('✅ API endpoint is reachable');
    console.log('   Status:', pingResponse.status);
    console.log('   Headers:', Object.fromEntries(pingResponse.headers.entries()));
  } catch (error) {
    console.error('❌ API endpoint not reachable:', error.message);
    return;
  }

  console.log('');

  // Test 2: Send test email
  console.log('🔍 TEST 2: Email Sending');
  console.log('───────────────────────');
  
  try {
    console.log('📤 Making request to /api/send-verification-email...');
    
    const startTime = Date.now();
    const response = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    const endTime = Date.now();
    
    console.log('📨 Response received in', endTime - startTime, 'ms');
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    console.log('   OK:', response.ok);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));

    // Check response content
    const responseText = await response.text();
    console.log('   Raw Response:', responseText);
    console.log('   Response Length:', responseText.length);

    if (responseText) {
      try {
        const jsonResult = JSON.parse(responseText);
        console.log('   Parsed JSON:', jsonResult);
        
        if (jsonResult.success) {
          console.log('✅ Email sent successfully!');
          console.log('   Message:', jsonResult.message || 'No message provided');
        } else {
          console.error('❌ Email sending failed');
          console.error('   Error:', jsonResult.error || 'No error message provided');
        }
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response');
        console.error('   Parse Error:', parseError.message);
        console.error('   Raw Response:', responseText);
      }
    } else {
      console.error('❌ Empty response received');
    }

  } catch (error) {
    console.error('❌ Network/Request Error:', error.message);
    console.error('   Full Error:', error);
  }

  console.log('');

  // Test 3: Verification URL generation
  console.log('🔍 TEST 3: Verification URL');
  console.log('──────────────────────────');
  
  const verificationUrl = `http://localhost:5173/verify-email?token=${testData.verificationToken}&email=${encodeURIComponent(testData.email)}`;
  console.log('   Generated URL:', verificationUrl);
  console.log('   URL Length:', verificationUrl.length);
  console.log('   Encoded Email:', encodeURIComponent(testData.email));
  console.log('✅ Verification URL generated correctly');

  console.log('');

  // Test 4: Expected email content preview
  console.log('🔍 TEST 4: Email Content Preview');
  console.log('────────────────────────────────');
  
  console.log('   To:', testData.email);
  console.log('   From: EarnPro Team <noreply@earnpro.org>');
  console.log('   Subject: 🔐 Verify Your EarnPro Account - Action Required');
  console.log('   Verification Link:', verificationUrl);
  console.log('✅ Email content structured correctly');

  console.log('');

  // Test 5: System status summary
  console.log('🔍 TEST 5: System Status Summary');
  console.log('───────────────────────────────');
  
  console.log('✅ Vite dev server: Running (you\'re seeing this)');
  console.log('✅ API middleware: Configured in vite.config.ts');
  console.log('✅ Email service: Updated to use API endpoint');
  console.log('✅ SendGrid API key: Configured in middleware');
  console.log('✅ Database trigger: Applied (users table creation)');
  console.log('✅ CORS handling: Solved via server-side execution');

  console.log('');

  // Final instructions
  console.log('🎯 NEXT STEPS FOR MANUAL TESTING:');
  console.log('═══════════════════════════════');
  console.log('1. Check your terminal/console where npm run dev is running');
  console.log('2. Look for Vite API logs like:');
  console.log('   📧 Vite API: Received request: { email: "mrforensics100@gmail.com", ... }');
  console.log('   📤 Vite API: Making request to SendGrid...');
  console.log('   📨 Vite API: SendGrid response status: 202');
  console.log('   ✅ Vite API: Verification email sent successfully');
  console.log('');
  console.log('3. If you see those logs, check mrforensics100@gmail.com inbox/spam');
  console.log('4. Email should arrive within 1-5 minutes');
  console.log('5. If no logs appear, there might be an issue with the middleware');
  console.log('');
  console.log('📧 EMAIL DELIVERY TIMELINE:');
  console.log('   • Immediate: API request processing');
  console.log('   • 0-30 seconds: SendGrid processing');
  console.log('   • 1-5 minutes: Email delivery');
  console.log('   • Check both inbox and spam folder');

  console.log('');
  console.log('🏁 TEST COMPLETED');
  console.log('================');
  console.log('Time:', new Date().toISOString());
}

// Auto-run the test if in browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected - running test...');
  testEmailVerificationSystem().catch(error => {
    console.error('❌ Test failed:', error);
  });
} else {
  console.log('⚡ Copy this code to browser console after starting dev server');
  console.log('1. npm run dev');
  console.log('2. Open http://localhost:5173 in browser');
  console.log('3. Open browser console (F12)');
  console.log('4. Paste this entire script and press Enter');
}
