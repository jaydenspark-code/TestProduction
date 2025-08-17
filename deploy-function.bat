@echo off
echo 🚀 Deploying Email Verification Function...
echo.

echo 📋 Step 1: Check Supabase CLI status
supabase --version
echo.

echo 📋 Step 2: Login to Supabase (if needed)
supabase login
echo.

echo 📋 Step 3: Link project
supabase link --project-ref bmtaqilpuszwoshtizmq
echo.

echo 📋 Step 4: Deploy function
supabase functions deploy verify-email
echo.

echo 📋 Step 5: Test deployment
echo Testing function at: https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token=test
curl -s "https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token=test"
echo.

echo ✅ Deployment complete! 
echo 🧪 Test the URL in your browser to confirm it works.
