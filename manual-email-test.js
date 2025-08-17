// Quick manual test for email verification with mrforensics100@gmail.com
const testData = {
  email: 'mrforensics100@gmail.com',
  fullName: 'Mr Forensics',
  verificationToken: `test-${Date.now()}-${Math.random().toString(36).substring(2)}`
};

console.log('🧪 MANUAL EMAIL TEST');
console.log('===================');
console.log('Email:', testData.email);
console.log('Token:', testData.verificationToken);

async function testEmailAPI() {
  try {
    console.log('\n📧 Calling API endpoint...');
    
    const response = await fetch('http://localhost:5173/api/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('❌ Error JSON:', errorJson);
      } catch (e) {
        console.log('❌ Error (raw text):', errorText);
      }
    }
  } catch (error) {
    console.error('❌ Network/Fetch error:', error);
  }
}

// Test if we're in browser environment
if (typeof window !== 'undefined') {
  console.log('\n🌐 Running in browser environment');
  testEmailAPI();
} else {
  console.log('\n⚡ Run this in browser console after starting dev server');
  console.log('1. npm run dev');
  console.log('2. Open browser to http://localhost:5173');
  console.log('3. Open console and paste this code');
}
