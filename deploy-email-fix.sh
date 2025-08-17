#!/bin/bash
# Deploy Email Verification Fix

echo "🚀 Deploying Email Verification Fix..."

# Deploy the verify-email Edge Function
echo "📤 Deploying verify-email Edge Function..."
supabase functions deploy verify-email --project-ref bmtaqilpuszwoshtizmq

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ verify-email function deployed successfully!"
    echo ""
    echo "📋 Your verification links will now work!"
    echo "🔗 Function URL: https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email"
    echo ""
    echo "🧪 To test, visit a verification link from your email"
else
    echo "❌ Function deployment failed!"
    echo "Please check your Supabase CLI configuration"
fi

echo ""
echo "📚 Next steps:"
echo "1. Run FIX_EMAIL_VERIFICATION.sql in Supabase SQL Editor"
echo "2. Test email verification with a new registration"
echo "3. Check that verification links now work properly"
