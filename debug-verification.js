console.log('🔍 Diagnosing Email Verification Issue...');

// This script will help us understand why verification is failing

async function diagnoseVerificationIssue() {
  try {
    console.log('🔧 Step 1: Testing Edge Function directly...');
    
    // Test with the actual token from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentToken = urlParams.get('token');
    
    if (currentToken) {
      console.log('🎯 Found token in URL:', currentToken.substring(0, 10) + '...');
      
      // Test the Edge Function with this token
      const testUrl = `https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token=${currentToken}`;
      
      try {
        const response = await fetch(testUrl, { 
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log('📨 Edge Function Response Status:', response.status);
        const responseText = await response.text();
        console.log('📄 Response Content Length:', responseText.length);
        
        // Check if it's HTML (error page) or JSON (success)
        if (responseText.includes('<!DOCTYPE html>')) {
          console.log('❌ Received HTML error page');
          if (responseText.includes('Verification Failed')) {
            console.log('🚨 ISSUE: Token verification failed in database');
          }
        } else {
          try {
            const jsonResponse = JSON.parse(responseText);
            console.log('✅ JSON Response:', jsonResponse);
          } catch {
            console.log('⚠️ Response is neither valid HTML nor JSON');
          }
        }
        
      } catch (error) {
        console.error('❌ Failed to call Edge Function:', error);
      }
    } else {
      console.log('⚠️ No token found in current URL');
    }
    
    console.log('🔧 Step 2: Testing database connection...');
    
    // Import Supabase to test database
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      
      // Use your Supabase URL (visible in the browser URL)
      const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
      const supabaseAnonKey = 'your-anon-key-here'; // You'll need to get this
      
      console.log('🔗 Supabase URL:', supabaseUrl);
      
      // For now, let's just test if we can reach the database
      console.log('ℹ️ Database connectivity test would require anon key');
      
    } catch (error) {
      console.error('❌ Could not load Supabase client:', error);
    }
    
    console.log('🔧 Step 3: Checking token format...');
    
    if (currentToken) {
      console.log('📏 Token length:', currentToken.length);
      console.log('🔤 Token format:', /^[a-zA-Z0-9\-]+$/.test(currentToken) ? 'Valid' : 'Invalid characters');
      
      // Check if token looks like the format we generate
      const tokenParts = currentToken.split('-');
      console.log('🧩 Token parts:', tokenParts.length);
      
      if (tokenParts.length >= 2) {
        const timestamp = tokenParts[0];
        if (/^\d+$/.test(timestamp)) {
          const tokenDate = new Date(parseInt(timestamp));
          const now = new Date();
          const ageHours = (now.getTime() - tokenDate.getTime()) / (1000 * 60 * 60);
          
          console.log('📅 Token created:', tokenDate.toLocaleString());
          console.log('⏰ Token age (hours):', ageHours.toFixed(2));
          
          if (ageHours > 24) {
            console.log('🚨 ISSUE: Token is expired (older than 24 hours)');
          } else {
            console.log('✅ Token age is valid');
          }
        } else {
          console.log('⚠️ Token doesn\'t follow timestamp format');
        }
      } else {
        console.log('⚠️ Unexpected token format');
      }
    }
    
    console.log('📋 DIAGNOSIS SUMMARY:');
    console.log('1. Check if the database function verify_email_token exists');
    console.log('2. Check if email_verification_tokens table has data');
    console.log('3. Check if token exists and hasn\'t expired');
    console.log('4. Check Supabase Edge Function logs for detailed errors');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
}

// Auto-run if we're on a verification page
if (window.location.href.includes('verify-email')) {
  diagnoseVerificationIssue();
} else {
  console.log('💡 Run diagnoseVerificationIssue() to debug verification issues');
  window.diagnoseVerificationIssue = diagnoseVerificationIssue;
}
