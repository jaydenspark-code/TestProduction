// Direct API test for debugging
const testEmailAPI = async () => {
  console.log('🧪 TESTING EMAIL API ENDPOINT');
  console.log('=============================');
  
  const testData = {
    email: 'mrforensics100@gmail.com',
    fullName: 'Mr Forensics',
    verificationToken: `test-${Date.now()}-debug`
  };

  console.log('Test data:', testData);
  
  try {
    console.log('📤 Making request to /api/send-verification-email...');
    
    const response = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📨 Response status:', response.status);
    console.log('📨 Response ok:', response.ok);
    console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📨 Raw response text:', responseText);
    console.log('📨 Response length:', responseText.length);

    if (responseText) {
      try {
        const jsonResult = JSON.parse(responseText);
        console.log('✅ Parsed JSON:', jsonResult);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Trying to parse:', responseText);
      }
    } else {
      console.error('❌ Empty response received');
    }

  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Run the test
testEmailAPI();
