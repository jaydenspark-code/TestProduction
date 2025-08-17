#!/bin/bash
# Quick test to check if email verification is working

echo "🔍 Testing Email Verification System..."
echo ""

echo "1. Testing Edge Function availability..."
response=$(curl -s -o /dev/null -w "%{http_code}" "https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token=test")

if [ "$response" = "200" ] || [ "$response" = "400" ]; then
    echo "✅ Edge Function is deployed and responding"
    echo "   HTTP Status: $response"
else
    echo "❌ Edge Function not available (Status: $response)"
    echo "   Need to deploy: supabase functions deploy verify-email"
fi

echo ""
echo "2. Testing Function URL in browser..."
echo "   Open: https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token=test"
echo "   Expected: HTML error page (not 404)"

echo ""
echo "3. Check Supabase Dashboard:"
echo "   Visit: https://app.supabase.com/project/bmtaqilpuszwoshtizmq/functions"
echo "   Look for: verify-email function with Active status"
