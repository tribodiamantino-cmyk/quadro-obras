# Script de Setup do Git
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GIT SETUP - QUADRO DE OBRAS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Verificar se Git está instalado
Write-Host "1. Verificando Git..." -ForegroundColor Yellow
$gitVersion = git --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "   OK: $gitVersion`n" -ForegroundColor Green
} else {
    Write-Host "   ERRO: Git nao encontrado!" -ForegroundColor Red
    Write-Host "   Instale em: https://git-scm.com/download/win`n" -ForegroundColor Yellow
    exit 1
}

# 2. Inicializar repositório
Write-Host "2. Inicializando repositorio Git..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "   OK: Git ja inicializado`n" -ForegroundColor Green
} else {
    git init
    Write-Host "   OK: Repositorio criado`n" -ForegroundColor Green
}

# 3. Verificar .gitignore
Write-Host "3. Verificando .gitignore..." -ForegroundColor Yellow
if (Test-Path .gitignore) {
    Write-Host "   OK: .gitignore existe`n" -ForegroundColor Green
} else {
    Write-Host "   AVISO: .gitignore nao encontrado`n" -ForegroundColor Yellow
}

# 4. Adicionar todos os arquivos
Write-Host "4. Adicionando arquivos..." -ForegroundColor Yellow
git add .
Write-Host "   OK: Arquivos adicionados`n" -ForegroundColor Green

# 5. Fazer commit inicial
Write-Host "5. Fazendo commit inicial..." -ForegroundColor Yellow
git commit -m "feat: sistema completo com importacao de dados" -m "- 41 projetos importados do sistema antigo" -m "- 140 tarefas com status mapeados" -m "- Sistema de obras com Supabase" -m "- Hot reload configurado" -m "- Documentacao completa"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   OK: Commit realizado`n" -ForegroundColor Green
} else {
    Write-Host "   AVISO: Commit falhou (pode ja existir)`n" -ForegroundColor Yellow
}

# 6. Criar branch main
Write-Host "6. Criando branch main..." -ForegroundColor Yellow
git branch -M main
Write-Host "   OK: Branch main criada`n" -ForegroundColor Green

# 7. Criar outras branches
Write-Host "7. Criando branches staging e development..." -ForegroundColor Yellow
git branch staging 2>$null
git branch development 2>$null
Write-Host "   OK: Branches criadas`n" -ForegroundColor Green

# 8. Listar branches
Write-Host "8. Branches disponiveis:" -ForegroundColor Yellow
git branch
Write-Host ""

# Resumo final
Write-Host "========================================" -ForegroundColor Green
Write-Host "  GIT CONFIGURADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "PROXIMO PASSO:" -ForegroundColor Cyan
Write-Host "1. Crie um repositorio no GitHub" -ForegroundColor White
Write-Host "   https://github.com/new`n" -ForegroundColor Gray

Write-Host "2. Execute os comandos:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/SEU_USUARIO/quadro-obras-sistema.git" -ForegroundColor Gray
Write-Host "   git push -u origin main`n" -ForegroundColor Gray

Write-Host "Pressione qualquer tecla para continuar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
