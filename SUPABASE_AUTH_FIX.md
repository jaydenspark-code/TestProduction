# SUPABASE AUTH CONFIGURATION GUIDE

# =============================================================================

## Problem:

Supabase is using its own OAuth redirect URLs instead of our custom ones.

## Solution:

Configure Supabase Auth settings in the dashboard.

## Steps:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set Site URL: https://www.earnpro.org
3. Set Redirect URLs:
   - https://www.earnpro.org/auth/callback
   - https://earnpro.org/auth/callback
   - http://localhost:5173/auth/callback

## Alternative: Update OAuth Implementation

Use direct Google OAuth instead of Supabase OAuth wrapper.
