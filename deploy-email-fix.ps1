# Deploy Email Verification Fix - PowerShell Version

Write-Host "🚀 Deploying Email Verification Fix..." -ForegroundColor Yellow

# Deploy the verify-email Edge Function
Write-Host "📤 Deploying verify-email Edge Function..." -ForegroundColor Cyan
supabase functions deploy verify-email --project-ref bmtaqilpuszwoshtizmq

# Check if deployment was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ verify-email function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Your verification links will now work!" -ForegroundColor Green
    Write-Host "🔗 Function URL: https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email" -ForegroundColor Blue
    Write-Host ""
    Write-Host "🧪 To test, visit a verification link from your email" -ForegroundColor Yellow
} else {
    Write-Host "❌ Function deployment failed!" -ForegroundColor Red
    Write-Host "Please check your Supabase CLI configuration" -ForegroundColor Red
}

Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Magenta
Write-Host "1. Run FIX_EMAIL_VERIFICATION.sql in Supabase SQL Editor" -ForegroundColor White
Write-Host "2. Test email verification with a new registration" -ForegroundColor White
Write-Host "3. Check that verification links now work properly" -ForegroundColor White
