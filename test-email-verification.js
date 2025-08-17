console.log('🧪 Testing Email Verification System...');

// Test the complete email verification flow
async function testEmailVerification() {
  try {
    console.log('📧 Step 1: Testing email sending via Vite API...');
    
    const testEmail = 'test@example.com';
    const testToken = 'test-token-' + Date.now();
    const testName = 'Test User';
    
    const response = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        verificationToken: testToken,
        name: testName
      })
    });
    
    console.log('📨 API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ API Response:', result);
    
    if (result.success) {
      console.log('✅ Step 1 PASSED: Email sending works');
      console.log('🔗 Verification URL:', result.verificationUrl);
      
      // Step 2: Test if the Edge Function URL is accessible
      console.log('📧 Step 2: Testing Edge Function accessibility...');
      
      try {
        const edgeResponse = await fetch(result.verificationUrl.replace(testToken, 'test-invalid-token'));
        console.log('🔗 Edge Function response status:', edgeResponse.status);
        
        if (edgeResponse.status === 400 || edgeResponse.status === 404) {
          console.log('✅ Step 2 PASSED: Edge Function is accessible (returned expected error for invalid token)');
        } else {
          console.log('⚠️ Step 2 WARNING: Edge Function returned unexpected status');
        }
        
        return true;
      } catch (edgeError) {
        console.error('❌ Step 2 FAILED: Edge Function not accessible:', edgeError.message);
        return false;
      }
    } else {
      console.error('❌ Step 1 FAILED: Email sending failed:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Test function to check what happens during registration
async function testRegistrationFlow() {
  console.log('🧪 Testing Registration Email Flow...');
  
  try {
    // Import the emailService to test it directly
    const { emailService } = await import('./src/services/emailService.ts');
    
    console.log('📧 Testing emailService.sendEmailVerification...');
    
    const testUser = {
      email: 'test@example.com',
      fullName: 'Test User',
      verificationToken: 'test-token-' + Date.now()
    };
    
    const result = await emailService.sendEmailVerification(testUser);
    
    if (result.success) {
      console.log('✅ emailService.sendEmailVerification WORKS');
      return true;
    } else {
      console.error('❌ emailService.sendEmailVerification FAILED:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Registration flow test failed:', error);
    return false;
  }
}

// Check if we're in the browser
if (typeof window !== 'undefined') {
  // Browser environment - add test functions to window
  window.testEmailVerification = testEmailVerification;
  window.testRegistrationFlow = testRegistrationFlow;
  
  console.log('🧪 Email verification tests loaded!');
  console.log('📧 Run: testEmailVerification() - Tests the complete email flow');
  console.log('📧 Run: testRegistrationFlow() - Tests the registration email sending');
  
  // Auto-run tests if URL contains test parameter
  if (window.location.search.includes('test=email')) {
    console.log('🚀 Auto-running email verification tests...');
    testEmailVerification().then(success => {
      if (success) {
        console.log('🎉 All email verification tests PASSED');
      } else {
        console.log('❌ Some email verification tests FAILED');
      }
    });
  }
} else {
  // Node environment - just export for testing
  module.exports = { testEmailVerification, testRegistrationFlow };
}
