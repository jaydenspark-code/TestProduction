@echo off
echo ===============================================
echo   SUPABASE EDGE FUNCTION DEPLOYMENT SCRIPT
echo ===============================================
echo.

echo Step 1: Check Supabase CLI installation...
supabase --version
if %errorlevel% neq 0 (
    echo ERROR: Supabase CLI not found!
    echo Please install it from: https://github.com/supabase/cli#install-the-cli
    pause
    exit /b 1
)

echo.
echo Step 2: Check project linking...
supabase status
if %errorlevel% neq 0 (
    echo WARNING: Project not linked. Linking now...
    supabase link --project-ref bmtaqilpuszwoshtizmq
)

echo.
echo Step 3: Deploy verify-email Edge Function...
supabase functions deploy verify-email

echo.
echo Step 4: Test the deployed function...
curl "https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token=test"

echo.
echo ===============================================
echo   DEPLOYMENT COMPLETE!
echo ===============================================
echo.
echo Your verify-email function should now be available at:
echo https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email
echo.
pause
