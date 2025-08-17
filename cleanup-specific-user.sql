-- Clean up the specific user causing the duplicate error
-- Run this in Supabase SQL Editor

-- First, delete privacy settings (foreign key constraint)
DELETE FROM user_privacy_settings 
WHERE user_id IN (
  SELECT id FROM users WHERE email = 'cornerston66@gmail.com'
);

-- Then delete the user
DELETE FROM users WHERE email = 'cornerston66@gmail.com';

-- Verify the user is gone
SELECT * FROM users WHERE email = 'cornerston66@gmail.com';
