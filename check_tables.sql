-- Check if email_verifications table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'email_verifications'
) AS table_exists;

-- If it exists, show its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'email_verifications'
ORDER BY ordinal_position;
