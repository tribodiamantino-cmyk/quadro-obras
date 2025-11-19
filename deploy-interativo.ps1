# ============================================
# DEPLOY INTERATIVO - RAILWAY
# ============================================

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "║        🚀 DEPLOY RAILWAY - PASSO A PASSO               ║" -ForegroundColor Cyan
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

$totalEtapas = 6
$etapaAtual = 1

# ============================================
# ETAPA 1: CRIAR REPOSITÓRIO NO GITHUB
# ============================================
function Etapa1-GitHub {
    Write-Host "[$etapaAtual/$totalEtapas] CRIAR REPOSITÓRIO NO GITHUB" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "O QUE FAZER:" -ForegroundColor Cyan
    Write-Host "  1. Abra: https://github.com/new" -ForegroundColor White
    Write-Host "  2. Nome do repositorio: quadro-obras-sistema" -ForegroundColor White
    Write-Host "  3. Privado ou Publico: PRIVADO (recomendado)" -ForegroundColor White
    Write-Host "  4. NAO marque 'Initialize with README'" -ForegroundColor White
    Write-Host "  5. Clique em 'Create repository'" -ForegroundColor White
    Write-Host ""
    
    # Abrir GitHub automaticamente
    Write-Host "Abrindo GitHub no navegador..." -ForegroundColor Gray
    Start-Process "https://github.com/new"
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "Pressione ENTER quando criar o repositorio..." -ForegroundColor Green
    Read-Host
}

# ============================================
# ETAPA 2: CONECTAR E ENVIAR CÓDIGO
# ============================================
function Etapa2-PushGitHub {
    param([int]$etapa)
    Write-Host "`n[$etapa/$totalEtapas] CONECTAR E ENVIAR CODIGO PARA GITHUB" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Digite o SEU usuario do GitHub:" -ForegroundColor Cyan
    Write-Host "(exemplo: se sua URL e https://github.com/joao123, digite: joao123)" -ForegroundColor Gray
    Write-Host ""
    $usuario = Read-Host "Usuario GitHub"
    
    Write-Host ""
    Write-Host "Configurando repositorio remoto..." -ForegroundColor Gray
    
    # Verificar se já existe remote
    $hasRemote = git remote -v 2>$null | Select-String "origin"
    if ($hasRemote) {
        Write-Host "  Removendo remote antigo..." -ForegroundColor Gray
        git remote remove origin 2>$null
    }
    
    # Adicionar novo remote
    $repoUrl = "https://github.com/$usuario/quadro-obras-sistema.git"
    git remote add origin $repoUrl
    
    Write-Host ""
    Write-Host "Enviando codigo para GitHub..." -ForegroundColor Cyan
    Write-Host "(Isso pode demorar alguns segundos...)" -ForegroundColor Gray
    Write-Host ""
    
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "OK! Codigo enviado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Seu repositorio: https://github.com/$usuario/quadro-obras-sistema" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "ERRO ao enviar codigo!" -ForegroundColor Red
        Write-Host "Verifique:" -ForegroundColor Yellow
        Write-Host "  1. Usuario do GitHub esta correto?" -ForegroundColor White
        Write-Host "  2. Repositorio foi criado?" -ForegroundColor White
        Write-Host "  3. Voce esta logado no Git?" -ForegroundColor White
        Write-Host ""
        Write-Host "Tentar novamente? (S/N)" -ForegroundColor Yellow
        $retry = Read-Host
        if ($retry -eq "S" -or $retry -eq "s") {
            Etapa2-PushGitHub -etapa $etapa
            return
        }
    }
    
    Write-Host "Pressione ENTER para continuar..." -ForegroundColor Green
    Read-Host
}

# ============================================
# ETAPA 3: CRIAR CONTA NO RAILWAY
# ============================================
function Etapa3-Railway {
    param([int]$etapa)
    Write-Host "`n[$etapa/$totalEtapas] CRIAR CONTA NO RAILWAY" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "O QUE FAZER:" -ForegroundColor Cyan
    Write-Host "  1. Abra: https://railway.app" -ForegroundColor White
    Write-Host "  2. Clique em 'Login'" -ForegroundColor White
    Write-Host "  3. Escolha 'Login with GitHub' (RECOMENDADO)" -ForegroundColor White
    Write-Host "  4. Autorize o Railway" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Abrindo Railway no navegador..." -ForegroundColor Gray
    Start-Process "https://railway.app/login"
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "Pressione ENTER quando estiver logado..." -ForegroundColor Green
    Read-Host
}

# ============================================
# ETAPA 4: CRIAR PROJETO NO RAILWAY
# ============================================
function Etapa4-CriarProjeto {
    param([int]$etapa)
    Write-Host "`n[$etapa/$totalEtapas] CRIAR PROJETO NO RAILWAY" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "O QUE FAZER:" -ForegroundColor Cyan
    Write-Host "  1. No Railway, clique em 'New Project'" -ForegroundColor White
    Write-Host "  2. Escolha 'Deploy from GitHub repo'" -ForegroundColor White
    Write-Host "  3. Selecione: quadro-obras-sistema" -ForegroundColor White
    Write-Host "  4. Branch: main" -ForegroundColor White
    Write-Host "  5. Clique em 'Deploy Now'" -ForegroundColor White
    Write-Host ""
    
    Write-Host "AGUARDE: O Railway vai:" -ForegroundColor Cyan
    Write-Host "  - Detectar que e um projeto Node.js" -ForegroundColor Gray
    Write-Host "  - Executar 'npm install'" -ForegroundColor Gray
    Write-Host "  - Tentar iniciar (vai falhar por falta de variaveis)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Abrindo Railway dashboard..." -ForegroundColor Gray
    Start-Process "https://railway.app/new"
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "Pressione ENTER quando o deploy aparecer..." -ForegroundColor Green
    Read-Host
}

# ============================================
# ETAPA 5: CONFIGURAR VARIÁVEIS
# ============================================
function Etapa5-Variaveis {
    param([int]$etapa)
    Write-Host "`n[$etapa/$totalEtapas] CONFIGURAR VARIAVEIS DE AMBIENTE" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    
    # Ler .env local
    Write-Host "Lendo variaveis do .env local..." -ForegroundColor Gray
    $envContent = Get-Content .env -Raw
    
    # Extrair variáveis importantes
    $supabaseUrl = ($envContent | Select-String "SUPABASE_URL=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
    $supabaseKey = ($envContent | Select-String "SUPABASE_ANON_KEY=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
    $jwtSecret = ($envContent | Select-String "JWT_SECRET=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
    
    Write-Host ""
    Write-Host "O QUE FAZER NO RAILWAY:" -ForegroundColor Cyan
    Write-Host "  1. No projeto, clique na aba 'Variables'" -ForegroundColor White
    Write-Host "  2. Adicione as seguintes variaveis:" -ForegroundColor White
    Write-Host ""
    
    Write-Host "COPIE E COLE CADA VARIAVEL:" -ForegroundColor Yellow
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
    Write-Host "(vamos ajustar isso depois)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host ""
    Write-Host "IMPORTANTE:" -ForegroundColor Red
    Write-Host "  - Copie EXATAMENTE como esta (sem espacos extras)" -ForegroundColor White
    Write-Host "  - Clique em 'Add' para cada variavel" -ForegroundColor White
    Write-Host "  - O Railway vai reiniciar automaticamente" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Pressione ENTER quando adicionar TODAS as variaveis..." -ForegroundColor Green
    Read-Host
}

# ============================================
# ETAPA 6: OBTER URL E TESTAR
# ============================================
function Etapa6-Validar {
    param([int]$etapa)
    Write-Host "`n[$etapa/$totalEtapas] OBTER URL E VALIDAR SISTEMA" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "O QUE FAZER:" -ForegroundColor Cyan
    Write-Host "  1. No Railway, va em 'Settings'" -ForegroundColor White
    Write-Host "  2. Na secao 'Domains', clique em 'Generate Domain'" -ForegroundColor White
    Write-Host "  3. Railway vai gerar uma URL tipo:" -ForegroundColor White
    Write-Host "     https://quadro-obras-sistema-production.up.railway.app" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Digite a URL que o Railway gerou:" -ForegroundColor Cyan
    $railwayUrl = Read-Host "URL"
    
    Write-Host ""
    Write-Host "IMPORTANTE - ATUALIZAR CORS:" -ForegroundColor Yellow
    Write-Host "  1. Volte em 'Variables'" -ForegroundColor White
    Write-Host "  2. Edite CORS_ORIGIN" -ForegroundColor White
    Write-Host "  3. Mude de * para: $railwayUrl" -ForegroundColor White
    Write-Host "  4. Salve e aguarde reiniciar" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Pressione ENTER quando ajustar o CORS..." -ForegroundColor Green
    Read-Host
    
    Write-Host ""
    Write-Host "Abrindo sistema em producao..." -ForegroundColor Cyan
    Start-Process $railwayUrl
    
    Write-Host ""
    Write-Host "TESTAR:" -ForegroundColor Yellow
    Write-Host "  1. Pagina de login aparece? OK" -ForegroundColor White
    Write-Host "  2. Faca login com: teste@teste.com OK" -ForegroundColor White
    Write-Host "  3. Ve os 42 projetos? OK" -ForegroundColor White
    Write-Host "  4. Consegue criar tarefa? OK" -ForegroundColor White
    Write-Host ""
}

# ============================================
# RESUMO FINAL
# ============================================
function ResumoFinal {
    Write-Host "`n" -ForegroundColor Green
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                          ║" -ForegroundColor Green
    Write-Host "║        🎉 DEPLOY CONCLUIDO COM SUCESSO! 🎉             ║" -ForegroundColor Green
    Write-Host "║                                                          ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "O QUE FOI FEITO:" -ForegroundColor Cyan
    Write-Host "  OK Repositorio criado no GitHub" -ForegroundColor Green
    Write-Host "  OK Codigo enviado" -ForegroundColor Green
    Write-Host "  OK Projeto criado no Railway" -ForegroundColor Green
    Write-Host "  OK Variaveis configuradas" -ForegroundColor Green
    Write-Host "  OK Sistema em producao!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "PROXIMOS PASSOS (OPCIONAL):" -ForegroundColor Yellow
    Write-Host "  1. Configurar dominio proprio" -ForegroundColor White
    Write-Host "  2. Monitorar logs no Railway" -ForegroundColor White
    Write-Host "  3. Organizar projetos importados" -ForegroundColor White
    Write-Host "  4. Convidar outros usuarios" -ForegroundColor White
    Write-Host ""
    
    Write-Host "DOCUMENTACAO:" -ForegroundColor Cyan
    Write-Host "  - DEPLOY-RAILWAY.md (completo)" -ForegroundColor Gray
    Write-Host "  - INICIO-RAPIDO.md (uso diario)" -ForegroundColor Gray
    Write-Host "  - IMPORTACAO-CONCLUIDA.md (dados)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Pressione ENTER para finalizar..." -ForegroundColor Green
    Read-Host
}

# ============================================
# EXECUTAR TODAS AS ETAPAS
# ============================================

try {
    Etapa1-GitHub
    Etapa2-PushGitHub -etapa 2
    Etapa3-Railway -etapa 3
    Etapa4-CriarProjeto -etapa 4
    Etapa5-Variaveis -etapa 5
    Etapa6-Validar -etapa 6
    ResumoFinal
    
    Write-Host ""
    Write-Host "Sistema disponivel 24/7 online! Parabens! 🚀" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERRO: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique os passos e tente novamente." -ForegroundColor Yellow
    Write-Host ""
}
