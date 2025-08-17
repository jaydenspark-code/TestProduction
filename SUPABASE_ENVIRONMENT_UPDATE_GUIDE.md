# 🔧 UPDATE SUPABASE EDGE FUNCTION ENVIRONMENT VARIABLES

## 🚨 Current Issue

Your local `.env` file has been updated with the correct Braintree credentials, but the **Supabase Edge Functions** are still using the old environment variables. This is why you're still getting the 401 error.

## ✅ Solution: Update Supabase Environment Variables

### Method 1: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account
   - Select your project (bmtaqilpuszwoshtizmq)

2. **Navigate to Edge Functions Settings:**
   - Click on "Edge Functions" in the left sidebar
   - Click on "Settings" or "Environment Variables"

3. **Update these environment variables:**

   ```
   BRAINTREE_ENVIRONMENT=sandbox
   BRAINTREE_MERCHANT_ID=2yhrvbtjszdbvxtt
   BRAINTREE_PUBLIC_KEY=sgfjmfv929kzffsr
   BRAINTREE_PRIVATE_KEY=4edc8a7489369f8e7d5cb8c9a8066c17
   ```

   **Important:** These are the correct credentials from your Braintree dashboard.

4. **Save and Deploy:**
   - Save the environment variables
   - The Edge Functions should automatically redeploy with the new variables

### Method 2: Via Supabase CLI (Alternative)

If you prefer using the CLI:

1. **Install Supabase CLI:**

   ```powershell
   # Using npm
   npm install supabase@">=1.8.1" --save-dev

   # Or using scoop (if you have scoop installed)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

2. **Login and link project:**

   ```powershell
   npx supabase login
   npx supabase link --project-ref bmtaqilpuszwoshtizmq
   ```

3. **Set environment variables:**
   ```powershell
   npx supabase secrets set BRAINTREE_ENVIRONMENT=sandbox
   npx supabase secrets set BRAINTREE_MERCHANT_ID=2yhrvbtjszdbvxtt
   npx supabase secrets set BRAINTREE_PUBLIC_KEY=sgfjmfv929kzffsr
   npx supabase secrets set BRAINTREE_PRIVATE_KEY=4edc8a7489369f8e7d5cb8c9a8066c17
   ```

## 🧪 Testing After Update

After updating the environment variables:

1. **Wait 1-2 minutes** for the Edge Functions to redeploy
2. **Try the Braintree payment again** in your app
3. **Check the browser console** for any remaining errors

## 🔍 How to Verify It's Working

The Edge Function should no longer return the 401 error. Instead, you should see:

- ✅ Braintree Drop-in UI loads successfully
- ✅ No "Credentials are required" error
- ✅ Payment flow proceeds normally

## 📞 Need Help?

If you're having trouble finding the environment variables section in Supabase:

1. Look for "Settings" → "Environment Variables"
2. Or "Edge Functions" → "Settings"
3. Or "Project Settings" → "Environment Variables"

The exact location may vary slightly depending on Supabase UI updates.
