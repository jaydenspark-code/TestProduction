# Supabase CORS Configuration Fix

The CORS errors indicate that your Supabase project needs to be configured to allow requests from your local development server.

## Option 1: Configure Supabase CORS Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: bmtaqilpuszwoshtizmq
3. Go to Settings > API
4. In the "API Settings" section, find "CORS Configuration"
5. Add these origins:
   - http://localhost:5173
   - http://localhost:5174
   - http://localhost:5175
   - http://127.0.0.1:5173
   - http://127.0.0.1:5174
   - http://127.0.0.1:5175

## Option 2: Use Different Supabase Client Configuration

If CORS settings can't be changed, we can modify the client configuration to work around it.

## The Issue

Your console shows:

- `Access to fetch at 'https://bmtaqilpuszwoshtizmq.supabase.co/rest/v1/...' from origin 'http://localhost:5175' has been blocked by CORS policy`

This means the Supabase server is rejecting requests from your development server due to CORS restrictions.
