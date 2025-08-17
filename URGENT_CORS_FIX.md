# URGENT: Fix Supabase CORS Configuration

## The Problem
The registration creates users only in memory (React state) but not in the database because CORS errors prevent Supabase communication.

## Solution Steps

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Sign in with your account
3. Select project: bmtaqilpuszwoshtizmq

### Step 2: Configure CORS Settings
1. Navigate to: **Settings** > **API** 
2. Look for **"CORS Configuration"** or **"Site URL"** or **"Additional URLs"**
3. Add these origins:
   ```
   http://localhost:5173
   http://localhost:5174
   http://localhost:5175
   http://127.0.0.1:5173
   http://127.0.0.1:5174
   http://127.0.0.1:5175
   ```

### Step 3: Alternative Locations to Check
If you don't see CORS settings in API, check:
- **Settings** > **General** > **Site URL**
- **Settings** > **Auth** > **Site URL** 
- **Settings** > **Auth** > **Redirect URLs**

### Step 4: What to Add
Add each of these as separate entries:
- http://localhost:5173
- http://localhost:5174  
- http://localhost:5175

## If You Can't Find CORS Settings
Some Supabase projects have CORS enabled for localhost by default. The issue might be the specific port (5175) not being allowed.

Let me know what you see in the Supabase dashboard and I'll help you find the right setting!
