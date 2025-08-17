# 🔧 MANUAL RLS FIX FOR REGISTRATION ISSUE

## Problem Identified ✅

The issue with your registration page was caused by **overly restrictive RLS (Row Level Security) policies** on the `users` table. The recent OAuth fixes created policies that require users to already be authenticated before they can insert records, which creates a chicken-and-egg problem for manual registration.

## Root Cause

- Previous RLS policies required `auth.uid() = id` for INSERT operations
- Manual registration needs to CREATE a user first, but `auth.uid()` only exists AFTER authentication
- This means new users couldn't register because they weren't authenticated yet

## Quick Fix Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `bmtaqilpuszwoshtizmq`
3. Click on "SQL Editor" in the left sidebar

### Step 2: Execute This SQL Script

Copy and paste this exact SQL into the SQL editor and run it:

```sql
-- Fix Manual Registration RLS Policy Issue
-- This removes the restrictive policies and adds a permissive one

BEGIN;

-- Display current policies for debugging
SELECT 'Current RLS Policies for users table:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Drop all existing INSERT policies that are too restrictive
DROP POLICY IF EXISTS "Allow authenticated user creation" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow OAuth user creation" ON public.users;
DROP POLICY IF EXISTS "Allow OAuth user upsert" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;

-- Create a new comprehensive INSERT policy that allows:
-- 1. Manual registration (before user is authenticated)
-- 2. OAuth registration (after auth.user exists but before public.users record)
-- 3. Service role operations
CREATE POLICY "Allow user registration and OAuth creation" ON public.users
    FOR INSERT
    WITH CHECK (
        -- Case 1: Manual registration - allow if no auth context yet (anonymous users)
        auth.uid() IS NULL
        OR
        -- Case 2: OAuth registration - user is authenticated and creating their own record
        (auth.uid() IS NOT NULL AND auth.uid() = id)
        OR
        -- Case 3: Service role operations
        current_setting('role') = 'service_role'
    );

-- Verify policies after update
SELECT 'Updated RLS Policies for users table:' as info;
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

COMMIT;

-- Success message
SELECT '✅ Manual registration RLS policy fixed!' as result;
```

### Step 3: Test the Fix

After running the SQL script:

1. **Remove CORS bypass mode** from your registration form
2. **Test manual registration** with a real email address
3. **Verify the user gets created** in the database
4. **Check that email verification** still works

## What This Fix Does

✅ **Allows anonymous users to register** (fixes the main issue)
✅ **Maintains OAuth registration** (Google sign-in still works)  
✅ **Preserves admin access** (service role can still create users)
✅ **Keeps existing security** (users can only access their own data)

## Next Steps After SQL Fix

1. **Update AuthContext.tsx** to remove the CORS bypass mode
2. **Test real registration** instead of mock users
3. **Verify database storage** is working
4. **Confirm email verification** flow works end-to-end

This should completely resolve your registration page refresh issue and restore proper database functionality! 🎉
