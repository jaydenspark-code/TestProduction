# MANUAL EDGE FUNCTION DEPLOYMENT GUIDE

## Option 1: Install Supabase CLI and Deploy

### Install Supabase CLI (Choose one method):

**Windows PowerShell (as Administrator):**
```powershell
winget install Supabase.CLI
```

**Or using Chocolatey:**
```powershell
choco install supabase
```

**Or download binary manually:**
1. Go to https://github.com/supabase/cli/releases/latest
2. Download `supabase_windows_amd64.tar.gz`
3. Extract and add to PATH

### Deploy Function:
```bash
# 1. Link to your project
supabase link --project-ref bmtaqilpuszwoshtizmq

# 2. Deploy the verify-email function
supabase functions deploy verify-email

# 3. Test the function
curl "https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token=test"
```

## Option 2: Manual Upload via Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/bmtaqilpuszwoshtizmq
   - Navigate to: **Functions** → **Edge Functions**

2. **Create New Function:**
   - Click **"Create Function"**
   - Name: `verify-email`
   - Copy the code from: `supabase/functions/verify-email/index.ts`

3. **Deploy Function:**
   - Paste the code into the editor
   - Click **"Deploy"**

## Option 3: Verify Current Status

Test if the function is already deployed:
```bash
curl "https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token=test"
```

**Expected Response:**
- If deployed: HTML error page (since "test" is invalid token)
- If not deployed: `{"code": "NOT_FOUND", "message": "Requested function was not found"}`

## Your Complete Email Verification Flow:

1. **User Registration** → SendGrid email sent
2. **Email Link Click** → `https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token=REAL_TOKEN`
3. **Verification Success** → Redirects to `http://localhost:5173/payment`
4. **Payment Page** → Multi-gateway selection (Braintree/PayPal/Paystack)
5. **Payment Success** → Account activated with $3 welcome bonus

## Environment Variables Needed:

Make sure these are set in Supabase Edge Functions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL` (your frontend URL, e.g., `http://localhost:5173`)

## Troubleshooting:

- **Function returns NOT_FOUND**: Function not deployed
- **Database errors**: Check if email verification functions exist in database
- **Redirect fails**: Check APP_URL environment variable
