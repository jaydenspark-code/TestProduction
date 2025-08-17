# Quick test to check if email verification is working

Write-Host "🔍 Testing Email Verification System..." -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Testing Edge Function availability..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token=test" -UseBasicParsing -ErrorAction SilentlyContinue
    $statusCode = $response.StatusCode
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
}

if ($statusCode -eq 200 -or $statusCode -eq 400) {
    Write-Host "✅ Edge Function is deployed and responding" -ForegroundColor Green
    Write-Host "   HTTP Status: $statusCode" -ForegroundColor Green
} else {
    Write-Host "❌ Edge Function not available (Status: $statusCode)" -ForegroundColor Red
    Write-Host "   Need to deploy: supabase functions deploy verify-email" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Testing Function URL in browser..." -ForegroundColor Cyan
Write-Host "   Open: https://bmtaqilpuszwoshtizmq.supabase.co/functions/v1/verify-email?token=test" -ForegroundColor Blue
Write-Host "   Expected: HTML error page (not 404)" -ForegroundColor Gray

Write-Host ""
Write-Host "3. Check Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "   Visit: https://app.supabase.com/project/bmtaqilpuszwoshtizmq/functions" -ForegroundColor Blue
Write-Host "   Look for: verify-email function with Active status" -ForegroundColor Gray
