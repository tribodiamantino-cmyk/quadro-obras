# ========================================
# CONFIGURAÇÃO INICIAL DO GIT FLOW
# ========================================
# Configura automaticamente a estrutura de branches
# Execute UMA vez no início do projeto
#

param(
    [switch]$Force
)

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 SETUP GIT FLOW - QUADRO DE OBRAS  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Verificar Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git não instalado!" -ForegroundColor Red
    Write-Host "   Instale em: https://git-scm.com`n" -ForegroundColor Yellow
    exit 1
}

# Verificar se já existe .git
if (Test-Path .git) {
    if (-not $Force) {
        Write-Host "⚠️  Repositório Git já inicializado!" -ForegroundColor Yellow
        $continue = Read-Host "Continuar mesmo assim? (s/N)"
        if ($continue -ne "s") {
            Write-Host "❌ Operação cancelada`n" -ForegroundColor Red
            exit 0
        }
    }
} else {
    Write-Host "📂 Inicializando repositório Git..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Repositório criado`n" -ForegroundColor Green
}

# Criar .gitignore
Write-Host "📝 Configurando .gitignore..." -ForegroundColor Cyan
$gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*

# Environment
.env
.env.*
!.env.example

# Database
*.db
*.sqlite
db.json
db.json.backup.*
dados-antigos.json

# Backups
backup/
*.backup

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Build
dist/
build/

# Temp
tmp/
temp/
*.tmp
"@

Set-Content -Path .gitignore -Value $gitignoreContent -Force
Write-Host "✅ .gitignore configurado`n" -ForegroundColor Green

# Commit inicial
$hasCommits = git log --oneline 2>$null
if (-not $hasCommits) {
    Write-Host "📦 Criando commit inicial..." -ForegroundColor Cyan
    git add .
    git commit -m "chore: initial commit - Quadro de Obras v2.0"
    Write-Host "✅ Commit inicial criado`n" -ForegroundColor Green
}

# Renomear branch para main
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "🔄 Renomeando branch para 'main'..." -ForegroundColor Cyan
    git branch -M main
    Write-Host "✅ Branch 'main' criada`n" -ForegroundColor Green
}

# Criar branches
Write-Host "🌿 Criando estrutura de branches..." -ForegroundColor Cyan

$branches = @('development', 'staging')
foreach ($branch in $branches) {
    $exists = git branch --list $branch
    if (-not $exists) {
        git branch $branch
        Write-Host "   ✅ $branch" -ForegroundColor Green
    } else {
        Write-Host "   ⏭️  $branch (já existe)" -ForegroundColor Yellow
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ GIT FLOW CONFIGURADO!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Mostrar branches
Write-Host "📊 Branches disponíveis:" -ForegroundColor Yellow
git branch -a | ForEach-Object {
    if ($_ -match '\*') {
        Write-Host "   $_ ← você está aqui" -ForegroundColor Green
    } else {
        Write-Host "   $_" -ForegroundColor White
    }
}

Write-Host "`n🎯 Próximos passos:`n" -ForegroundColor Yellow
Write-Host "1. Trocar para development:" -ForegroundColor White
Write-Host "   git checkout development`n" -ForegroundColor Cyan

Write-Host "2. Criar uma feature:" -ForegroundColor White
Write-Host "   git checkout -b feature/minha-feature`n" -ForegroundColor Cyan

Write-Host "3. Desenvolver com hot reload:" -ForegroundColor White
Write-Host "   npm run dev`n" -ForegroundColor Cyan

$switchToDev = Read-Host "Deseja trocar para 'development' agora? (S/n)"
if ($switchToDev -ne "n") {
    git checkout development
    Write-Host "`n✅ Agora você está em: development" -ForegroundColor Green
    Write-Host "   Pronto para desenvolver! 🚀`n" -ForegroundColor Cyan
}
