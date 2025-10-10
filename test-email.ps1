# Test de l'envoi d'email avec Resend API
$RESEND_API_KEY = "re_eB7EYahQ_38j5cShU5cch8M2AsegHBuHP"
$EMAIL_FROM = "no-reply@diaspomoney.fr"
$EMAIL_TO = "b.malar@diaspomoney.fr"

Write-Host "🧪 Test de l'API Resend..." -ForegroundColor Cyan

# Créer un fichier de test
"Test content" | Out-File -FilePath "test.txt" -Encoding UTF8

# Encoder en base64
$Content = Get-Content "test.txt" -Raw
$Bytes = [System.Text.Encoding]::UTF8.GetBytes($Content)
$Base64 = [System.Convert]::ToBase64String($Bytes)

# JSON pour l'API
$JsonData = @{
    from = $EMAIL_FROM
    to = @($EMAIL_TO)
    subject = "Test Resend API - $(Get-Date)"
    html = "<h2>Test Resend</h2><p>Ceci est un test de l'API Resend.</p>"
    attachments = @(
        @{
            filename = "test.txt"
            content = $Base64
            type = "text/plain"
        }
    )
} | ConvertTo-Json -Depth 3

Write-Host "📤 Envoi du test..." -ForegroundColor Yellow

try {
    $Response = Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method POST -Headers @{
        "Authorization" = "Bearer $RESEND_API_KEY"
        "Content-Type" = "application/json"
    } -Body $JsonData
    
    Write-Host "✅ Test réussi ! Email envoyé à $EMAIL_TO" -ForegroundColor Green
    Write-Host "ID: $($Response.id)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Test échoué: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.Exception.Response)" -ForegroundColor Yellow
}

# Nettoyer
Remove-Item "test.txt" -ErrorAction SilentlyContinue
