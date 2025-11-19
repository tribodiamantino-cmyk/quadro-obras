# DEPLOY INTERATIVO - RAILWAY
# Versao simplificada sem caracteres especiais

Clear-Host
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY RAILWAY - PASSO A PASSO" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ETAPA 1: GITHUB
Write-Host "[1/6] CRIAR REPOSITORIO NO GITHUB" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "PASSOS:" -ForegroundColor Cyan
Write-Host "1. Abra: https://github.com/new" -ForegroundColor White
Write-Host "2. Nome: quadro-obras-sistema" -ForegroundColor White
Write-Host "3. Tipo: PRIVADO (recomendado)" -ForegroundColor White
Write-Host "4. NAO marque 'Initialize with README'" -ForegroundColor White
Write-Host "5. Clique em 'Create repository'" -ForegroundColor White
Write-Host ""

Start-Process "https://github.com/new"
Write-Host "Abrindo GitHub..." -ForegroundColor Gray
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Pressione ENTER quando criar o repositorio..." -ForegroundColor Green
Read-Host

# ETAPA 2: PUSH
Write-Host ""
Write-Host "[2/6] ENVIAR CODIGO PARA GITHUB" -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "Digite seu usuario do GitHub:" -ForegroundColor Cyan
Write-Host "(ex: se e https://github.com/joao123, digite: joao123)" -ForegroundColor Gray
$usuario = Read-Host "Usuario"

Write-Host ""
Write-Host "Configurando e enviando..." -ForegroundColor Gray

git remote remove origin 2>$null
git remote add origin "https://github.com/$usuario/quadro-obras-sistema.git"
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "OK! Codigo enviado!" -ForegroundColor Green
    Write-Host "Repositorio: https://github.com/$usuario/quadro-obras-sistema" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ERRO! Verifique:" -ForegroundColor Red
    Write-Host "- Usuario correto?" -ForegroundColor Yellow
    Write-Host "- Repositorio criado?" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Tente executar este comando manualmente:" -ForegroundColor Yellow
    Write-Host "git push -u origin main" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Pressione ENTER para continuar..." -ForegroundColor Green
Read-Host

# ETAPA 3: RAILWAY LOGIN
Write-Host ""
Write-Host "[3/6] CRIAR CONTA NO RAILWAY" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "PASSOS:" -ForegroundColor Cyan
Write-Host "1. Abra: https://railway.app" -ForegroundColor White
Write-Host "2. Clique em 'Login'" -ForegroundColor White
Write-Host "3. Escolha 'Login with GitHub'" -ForegroundColor White
Write-Host "4. Autorize o Railway" -ForegroundColor White
Write-Host ""

Start-Process "https://railway.app/login"
Write-Host "Abrindo Railway..." -ForegroundColor Gray
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Pressione ENTER quando estiver logado..." -ForegroundColor Green
Read-Host

# ETAPA 4: CRIAR PROJETO
Write-Host ""
Write-Host "[4/6] CRIAR PROJETO NO RAILWAY" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "PASSOS:" -ForegroundColor Cyan
Write-Host "1. Clique em 'New Project'" -ForegroundColor White
Write-Host "2. Escolha 'Deploy from GitHub repo'" -ForegroundColor White
Write-Host "3. Selecione: quadro-obras-sistema" -ForegroundColor White
Write-Host "4. Branch: main" -ForegroundColor White
Write-Host "5. Clique em 'Deploy Now'" -ForegroundColor White
Write-Host ""
Write-Host "O Railway vai instalar e tentar iniciar" -ForegroundColor Gray
Write-Host "(vai falhar por falta de variaveis - OK)" -ForegroundColor Gray
Write-Host ""

Start-Process "https://railway.app/new"
Write-Host "Abrindo Railway..." -ForegroundColor Gray
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Pressione ENTER quando o projeto aparecer..." -ForegroundColor Green
Read-Host

# ETAPA 5: VARIAVEIS
Write-Host ""
Write-Host "[5/6] CONFIGURAR VARIAVEIS DE AMBIENTE" -ForegroundColor Yellow
Write-Host "---------------------------------------" -ForegroundColor Yellow
Write-Host ""

# Ler .env
$envFile = Get-Content .env -Raw -ErrorAction SilentlyContinue
if ($envFile) {
    $supabaseUrl = ($envFile | Select-String "SUPABASE_URL=(.+)").Matches.Groups[1].Value
    $supabaseKey = ($envFile | Select-String "SUPABASE_ANON_KEY=(.+)").Matches.Groups[1].Value  
    $jwtSecret = ($envFile | Select-String "JWT_SECRET=(.+)").Matches.Groups[1].Value
} else {
    Write-Host "AVISO: .env nao encontrado!" -ForegroundColor Red
    $supabaseUrl = "COLE_AQUI"
    $supabaseKey = "COLE_AQUI"
    $jwtSecret = "COLE_AQUI"
}

Write-Host "NO RAILWAY:" -ForegroundColor Cyan
Write-Host "1. Clique na aba 'Variables'" -ForegroundColor White
Write-Host "2. Adicione cada variavel abaixo:" -ForegroundColor White
Write-Host ""

Write-Host "COPIE E COLE:" -ForegroundColor Yellow
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

Write-Host "Pressione ENTER quando adicionar TODAS..." -ForegroundColor Green
Read-Host

# ETAPA 6: URL E TESTE
Write-Host ""
Write-Host "[6/6] OBTER URL E TESTAR" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "PASSOS:" -ForegroundColor Cyan
Write-Host "1. No Railway, va em 'Settings'" -ForegroundColor White
Write-Host "2. Em 'Domains', clique 'Generate Domain'" -ForegroundColor White
Write-Host "3. Copie a URL gerada" -ForegroundColor White
Write-Host ""

Write-Host "Digite a URL do Railway:" -ForegroundColor Cyan
$url = Read-Host "URL"

Write-Host ""
Write-Host "IMPORTANTE - ATUALIZAR CORS:" -ForegroundColor Yellow
Write-Host "1. Volte em 'Variables'" -ForegroundColor White
Write-Host "2. Edite CORS_ORIGIN" -ForegroundColor White
Write-Host "3. Mude de * para: $url" -ForegroundColor White
Write-Host "4. Salve (vai reiniciar)" -ForegroundColor White
Write-Host ""

Write-Host "Pressione ENTER quando ajustar CORS..." -ForegroundColor Green
Read-Host

Write-Host ""
Write-Host "Abrindo sistema..." -ForegroundColor Cyan
Start-Process $url

Write-Host ""
Write-Host "TESTAR:" -ForegroundColor Yellow
Write-Host "1. Pagina de login aparece?" -ForegroundColor White
Write-Host "2. Login com: teste@teste.com" -ForegroundColor White
Write-Host "3. Ve os 42 projetos?" -ForegroundColor White
Write-Host ""

Write-Host "Pressione ENTER para finalizar..." -ForegroundColor Green
Read-Host

# RESUMO
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Seu sistema esta online 24/7!" -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor White
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "- Organizar projetos importados" -ForegroundColor Gray
Write-Host "- Configurar dominio proprio (opcional)" -ForegroundColor Gray
Write-Host "- Convidar usuarios" -ForegroundColor Gray
Write-Host ""
