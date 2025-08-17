-- Alternative: Update RLS policies to allow user creation
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;

-- Create a permissive policy for user registration
CREATE POLICY "Allow user registration" ON public.users
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id OR auth.role() = 'service_role');

-- Allow users to update their own data
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admin users to do everything
CREATE POLICY "Admin full access" ON public.users
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Refresh the policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
