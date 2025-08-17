# Supabase Database Setup Script
Write-Host "Setting up Supabase database schema..." -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Starting Supabase local development environment..." -ForegroundColor Yellow
npx supabase start
Write-Host ""

Write-Host "Step 2: Checking status..." -ForegroundColor Yellow
npx supabase status
Write-Host ""

Write-Host "Step 3: Applying database migrations..." -ForegroundColor Yellow
npx supabase db reset
Write-Host ""

Write-Host "Step 4: Final status check..." -ForegroundColor Yellow
npx supabase status
Write-Host ""

Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host "You can now access:" -ForegroundColor Cyan
Write-Host "- Studio: http://127.0.0.1:54323" -ForegroundColor White
Write-Host "- API: http://127.0.0.1:54321" -ForegroundColor White
Write-Host "- DB: postgresql://postgres:postgres@127.0.0.1:54322/postgres" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue..."
