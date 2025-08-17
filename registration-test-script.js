// REGISTRATION FLOW TEST SCRIPT
// Copy and paste this in browser console to test registration programmatically

console.log('🧪 Testing registration flow...');

// Test 1: Check if form exists
const form = document.querySelector('form');
if (form) {
    console.log('✅ Form found');
} else {
    console.log('❌ Form not found');
}

// Test 2: Check if submit button exists  
const submitButton = document.querySelector('button[type="submit"]');
if (submitButton) {
    console.log('✅ Submit button found:', submitButton.textContent);
} else {
    console.log('❌ Submit button not found');
}

// Test 3: Check if AuthContext is available
if (window.React) {
    console.log('✅ React is loaded');
} else {
    console.log('❌ React not detected');
}

// Test 4: Check current URL
console.log('📍 Current URL:', window.location.href);

// Test 5: Check for any JavaScript errors
console.log('🔍 Check console for any red error messages above this');

console.log('🎯 Manual test: Fill form and click "Register & Deposit" button');
console.log('📋 Expected: Console messages showing registration flow');
console.log('🎉 Success: Redirect to verify-code page with email parameter');
