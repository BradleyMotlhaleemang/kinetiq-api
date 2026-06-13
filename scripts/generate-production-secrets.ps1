# Generate production secrets for Kinetiq deploy.
# Run locally; paste output into Coolify or deploy/.env on the server.

function New-RandomHex([int]$bytes = 32) {
    $buffer = New-Object byte[] $bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    return [BitConverter]::ToString($buffer).Replace('-', '').ToLower()
}

Write-Host ""
Write-Host "=== Kinetiq production secrets (kinetiqlift.lol) ===" -ForegroundColor Cyan
Write-Host "Store these in Coolify only. Do not commit to git." -ForegroundColor Yellow
Write-Host ""
Write-Host "POSTGRES_PASSWORD=$(New-RandomHex 24)"
Write-Host "JWT_SECRET=$(New-RandomHex 48)"
Write-Host "JWT_REFRESH_SECRET=$(New-RandomHex 48)"
Write-Host ""
