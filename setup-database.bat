@echo off
echo Setting up Supabase database schema...
echo.

echo Step 1: Starting Supabase local development environment...
npx supabase start
echo.

echo Step 2: Checking status...
npx supabase status
echo.

echo Step 3: Applying database migrations...
npx supabase db reset
echo.

echo Step 4: Final status check...
npx supabase status
echo.

echo Database setup complete!
echo You can now access:
echo - Studio: http://127.0.0.1:54323
echo - API: http://127.0.0.1:54321
echo - DB: postgresql://postgres:postgres@127.0.0.1:54322/postgres
echo.
pause
