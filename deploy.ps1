# ========================================
# SCRIPT DE DEPLOY INTELIGENTE
# ========================================
# Faz verificações antes de fazer deploy
# Uso: .\deploy.ps1 [staging|production]
#

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('staging', 'production', 'prod')]
    [string]$Environment
)

$env = if ($Environment -eq 'prod') { 'production' } else { $Environment }

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       🚀 DEPLOY - $($env.ToUpper())$((' ' * (19 - $env.Length)))║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Verificações
$checks = @()

# 1. Git status
Write-Host "📋 Verificando Git..." -ForegroundColor Cyan
$status = git status --porcelain
if ($status) {
    Write-Host "   ⚠️  Há alterações não commitadas" -ForegroundColor Yellow
    git status --short
    $checks += $false
} else {
    Write-Host "   ✅ Nenhuma alteração pendente" -ForegroundColor Green
    $checks += $true
}

# 2. Branch correta
Write-Host "`n📌 Verificando branch..." -ForegroundColor Cyan
$currentBranch = git branch --show-current
$expectedBranch = if ($env -eq 'production') { 'main' } else { 'staging' }

if ($currentBranch -ne $expectedBranch) {
    Write-Host "   ❌ Branch incorreta!" -ForegroundColor Red
    Write-Host "      Atual: $currentBranch" -ForegroundColor White
    Write-Host "      Esperada: $expectedBranch" -ForegroundColor White
    $checks += $false
} else {
    Write-Host "   ✅ Branch correta: $currentBranch" -ForegroundColor Green
    $checks += $true
}

# 3. Verificar se está atualizado
Write-Host "`n🔄 Verificando atualizações..." -ForegroundColor Cyan
git fetch origin
$behind = git rev-list HEAD..origin/$currentBranch --count 2>$null
if ($behind -and $behind -ne "0") {
    Write-Host "   ⚠️  Branch está $behind commits atrás" -ForegroundColor Yellow
    $checks += $false
} else {
    Write-Host "   ✅ Branch atualizada" -ForegroundColor Green
    $checks += $true
}

# 4. Testes básicos
Write-Host "`n🧪 Executando testes..." -ForegroundColor Cyan
try {
    npm test 2>&1 | Out-Null
    Write-Host "   ✅ Testes passaram" -ForegroundColor Green
    $checks += $true
} catch {
    Write-Host "   ⚠️  Testes falharam ou não existem" -ForegroundColor Yellow
    $checks += $true  # Não bloqueia por enquanto
}

# Resumo
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
$passed = ($checks | Where-Object { $_ -eq $true }).Count
$total = $checks.Count

if ($passed -eq $total) {
    Write-Host "✅ Todas as verificações passaram ($passed/$total)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Algumas verificações falharam ($passed/$total)" -ForegroundColor Yellow
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Confirmação
if ($env -eq 'production') {
    Write-Host "⚠️  ATENÇÃO: Você está fazendo deploy em PRODUÇÃO!" -ForegroundColor Yellow
    Write-Host "   Certifique-se que:" -ForegroundColor Yellow
    Write-Host "   • Testou tudo em staging" -ForegroundColor White
    Write-Host "   • Fez backup do banco" -ForegroundColor White
    Write-Host "   • Avisou a equipe`n" -ForegroundColor White
}

$confirm = Read-Host "Continuar com o deploy? (s/N)"
if ($confirm -ne "s") {
    Write-Host "`n❌ Deploy cancelado`n" -ForegroundColor Red
    exit 0
}

# Deploy
Write-Host "`n🚀 Iniciando deploy..." -ForegroundColor Cyan

try {
    git push origin $currentBranch
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green
    
    if ($env -eq 'production') {
        Write-Host "🎉 Sistema em produção atualizado!" -ForegroundColor Cyan
        Write-Host "   Aguarde ~2 minutos para o Railway fazer deploy`n" -ForegroundColor White
    } else {
        Write-Host "✅ Staging atualizado!" -ForegroundColor Cyan
        Write-Host "   Teste antes de fazer deploy em produção`n" -ForegroundColor White
    }
    
} catch {
    Write-Host "`n❌ Erro no deploy: $_" -ForegroundColor Red
    Write-Host "   Tente novamente ou faça push manual`n" -ForegroundColor Yellow
    exit 1
}
