#!/bin/bash
# Supabase Environment Variables Setup for PayPal
# This script helps you configure the required environment variables

echo "🔧 SUPABASE ENVIRONMENT SETUP FOR PAYPAL"
echo "========================================="
echo ""

echo "📋 Required Environment Variables:"
echo "----------------------------------"
echo "PAYPAL_CLIENT_ID=AeNqpgsh9qaCHH4FDUQJy3-GVtmjSJqDlh0sSXTmUwDxyXhVCh7PiFtwew4CwGpcu3m-AR5N30V6FzGO"
echo "PAYPAL_CLIENT_SECRET=EHZgqnJWLTf5QLlGGULkyPSfxATQQGUGsGyCMRf3qSox5sg1swpi8a6-cBlz-e5IAtx5K7qXz1o0t4zk"
echo "APP_URL=http://localhost:5173"
echo ""

echo "📝 HOW TO ADD THESE TO SUPABASE:"
echo "--------------------------------"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Select your project: bmtaqilpuszwoshtizmq"
echo "3. Navigate to Settings → Edge Functions"
echo "4. Click 'Environment Variables'"
echo "5. Add each variable above (one by one)"
echo ""

echo "🔄 ALTERNATIVE METHOD (CLI):"
echo "----------------------------"
echo "If you have Supabase CLI installed:"
echo ""
echo "supabase secrets set PAYPAL_CLIENT_ID=AeNqpgsh9qaCHH4FDUQJy3-GVtmjSJqDlh0sSXTmUwDxyXhVCh7PiFtwew4CwGpcu3m-AR5N30V6FzGO"
echo "supabase secrets set PAYPAL_CLIENT_SECRET=EHZgqnJWLTf5QLlGGULkyPSfxATQQGUGsGyCMRf3qSox5sg1swpi8a6-cBlz-e5IAtx5K7qXz1o0t4zk"
echo "supabase secrets set APP_URL=http://localhost:5173"
echo ""

echo "✅ VERIFICATION:"
echo "----------------"
echo "After adding the variables:"
echo "1. Redeploy edge functions"
echo "2. Test PayPal payment flow"
echo "3. Check edge function logs for any errors"
echo ""

echo "🎯 NEXT STEPS AFTER SETUP:"
echo "--------------------------"
echo "1. Test PayPal payment with sandbox account"
echo "2. Verify return/cancel URLs work correctly"
echo "3. Check payment capture and user activation"
echo "4. Update APP_URL to production domain when deploying"
echo ""

echo "💡 PRODUCTION NOTES:"
echo "--------------------"
echo "• Change APP_URL to your production domain"
echo "• Use production PayPal credentials for live payments"
echo "• Update PayPal endpoints from sandbox to live"
echo ""

echo "✅ Setup complete! PayPal should work after configuring Supabase environment variables."
