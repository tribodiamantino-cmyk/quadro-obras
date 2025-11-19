# Ler variaveis do .env
Clear-Host
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VARIAVEIS PARA O RAILWAY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envContent = Get-Content .env -Raw -ErrorAction SilentlyContinue

if ($envContent) {
    $supabaseUrl = ($envContent | Select-String "SUPABASE_URL=(.+)").Matches.Groups[1].Value.Trim()
    $supabaseKey = ($envContent | Select-String "SUPABASE_ANON_KEY=(.+)").Matches.Groups[1].Value.Trim()
    $jwtSecret = ($envContent | Select-String "JWT_SECRET=(.+)").Matches.Groups[1].Value.Trim()

    Write-Host "Copie cada variavel abaixo:" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "PORT" -ForegroundColor Cyan
    Write-Host "4000" -ForegroundColor White
    Write-Host ""
    
    Write-Host "NODE_ENV" -ForegroundColor Cyan
    Write-Host "production" -ForegroundColor White
    Write-Host ""
    
    Write-Host "SUPABASE_URL" -ForegroundColor Cyan
    Write-Host "$supabaseUrl" -ForegroundColor White
    Write-Host ""
    
    Write-Host "SUPABASE_ANON_KEY" -ForegroundColor Cyan
    Write-Host "$supabaseKey" -ForegroundColor White
    Write-Host ""
    
    Write-Host "JWT_SECRET" -ForegroundColor Cyan
    Write-Host "$jwtSecret" -ForegroundColor White
    Write-Host ""
    
    Write-Host "JWT_EXPIRES_IN" -ForegroundColor Cyan
    Write-Host "7d" -ForegroundColor White
    Write-Host ""
    
    Write-Host "CORS_ORIGIN" -ForegroundColor Cyan
    Write-Host "*" -ForegroundColor White
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Adicione TODAS as variaveis acima no Railway!" -ForegroundColor Yellow
    Write-Host "Va em: Variables > Add Variable" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "ERRO: Arquivo .env nao encontrado!" -ForegroundColor Red
}

Write-Host "Pressione qualquer tecla para fechar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
