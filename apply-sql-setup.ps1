# PowerShell script to apply custom email verification system
# This will execute the SQL functions in Supabase

try {
    Write-Host "Setting up custom email verification system..." -ForegroundColor Cyan
    
    # Read the SQL file content
    $sqlContent = Get-Content "custom-email-verification-system.sql" -Raw
    
    # Split into individual commands
    $commands = $sqlContent -split ";" | Where-Object { $_.Trim() -ne "" }
    
    Write-Host "Found $($commands.Count) SQL commands to execute" -ForegroundColor Yellow
    
    # You would need to execute these in your Supabase SQL editor
    # For now, let's create a formatted file for manual execution
    
    $formattedSql = @"
-- Custom Email Verification System Setup
-- Execute these commands in your Supabase SQL Editor

$sqlContent
"@
    
    $formattedSql | Out-File "supabase-setup-commands.sql" -Encoding UTF8
    
    Write-Host "Created supabase-setup-commands.sql for manual execution" -ForegroundColor Green
    Write-Host "Please copy the content of this file to your Supabase SQL Editor" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
