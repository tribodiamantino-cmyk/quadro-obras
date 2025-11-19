# ⚡ COMANDOS RÁPIDOS - Quadro de Obras v2.0

## 🚀 SETUP INICIAL (Primeira Vez)

```powershell
# 1. Instalar dependências
npm install

# 2. Copiar .env
Copy-Item .env.example .env

# 3. Editar .env (adicionar DATABASE_URL e JWT_SECRET)

# 4. Gerar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 5. Subir PostgreSQL (Docker)
docker run --name quadro-postgres -e POSTGRES_PASSWORD=senha123 -p 5432:5432 -d postgres:15

# 6. Criar tabelas
npx prisma db push

# 7. Popular banco
npm run db:seed  # ou: node prisma/migrate-from-json.js

# 8. Renomear server
Move-Item server.js server-old.js; Move-Item server-new.js server.js

# 9. Iniciar
npm start
```

---

## 🗄️ DATABASE

```powershell
# Ver banco no navegador
npm run db:studio

# Criar migration
npm run db:migrate

# Aplicar schema (sem migration)
npm run db:push

# Resetar banco (CUIDADO!)
npx prisma migrate reset

# Seed (popular)
npm run db:seed

# Gerar Prisma Client
npx prisma generate

# Backup PostgreSQL
docker exec quadro-postgres pg_dump -U postgres quadro_obras > backup_$(Get-Date -Format 'yyyyMMdd').sql

# Restaurar backup
Get-Content backup.sql | docker exec -i quadro-postgres psql -U postgres quadro_obras
```

---

## 🐳 DOCKER

```powershell
# Subir PostgreSQL
docker run --name quadro-postgres -e POSTGRES_PASSWORD=senha123 -p 5432:5432 -d postgres:15

# Parar
docker stop quadro-postgres

# Iniciar
docker start quadro-postgres

# Remover
docker rm -f quadro-postgres

# Ver logs
docker logs -f quadro-postgres

# Entrar no PostgreSQL
docker exec -it quadro-postgres psql -U postgres

# Criar banco
docker exec -it quadro-postgres psql -U postgres -c "CREATE DATABASE quadro_obras;"

# Listar bancos
docker exec -it quadro-postgres psql -U postgres -c "\l"
```

---

## 🔧 DESENVOLVIMENTO

```powershell
# Iniciar com auto-reload
npm run dev

# Iniciar produção
npm start

# Ver logs
Get-Content -Path "server.log" -Wait  # se tiver logging em arquivo

# Testar API
Invoke-WebRequest http://localhost:3000/health
```

---

## 🧪 TESTES DA API

### Health Check
```powershell
curl http://localhost:3000/health
```

### Registrar Organização
```powershell
$body = @{
    email = "admin@teste.com"
    password = "senha123"
    name = "Admin Teste"
    organizationName = "Empresa Teste"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Login
```powershell
$body = @{
    email = "admin@teste.com"
    password = "senha123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$token = ($response.Content | ConvertFrom-Json).token
Write-Host "Token: $token"
```

### Buscar Estado (Autenticado)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/state" `
    -Method GET `
    -Headers $headers
```

---

## 🛠️ MANUTENÇÃO

```powershell
# Limpar node_modules
Remove-Item -Recurse -Force node_modules
npm install

# Atualizar dependências
npm outdated
npm update

# Verificar vulnerabilidades
npm audit
npm audit fix

# Limpar cache do npm
npm cache clean --force

# Limpar Prisma cache
Remove-Item -Recurse -Force node_modules\.prisma
npx prisma generate
```

---

## 📊 MONITORAMENTO

```powershell
# Ver processos Node
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Matar processo na porta 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }

# Ver uso de memória
Get-Process node | Select-Object ProcessName, @{Name="Memory(MB)";Expression={[math]::Round($_.WS / 1MB, 2)}}
```

---

## 🐛 DEBUG

```powershell
# Ver variáveis de ambiente
cat .env

# Testar conexão com banco
npx prisma db pull

# Ver schema atual
npx prisma db pull --print

# Console do Prisma
npx prisma studio

# Logs detalhados
$env:DEBUG = "*"
npm start
```

---

## 📦 DEPLOY

### Vercel
```powershell
# Instalar CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

### Railway
```powershell
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar
railway init

# Deploy
railway up
```

### Render
```powershell
# Build Command (no dashboard):
npm install && npx prisma generate && npx prisma db push

# Start Command:
npm start

# Variáveis:
DATABASE_URL=...
JWT_SECRET=...
NODE_ENV=production
```

---

## 🔐 SEGURANÇA

```powershell
# Gerar secret forte
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gerar UUID
node -e "console.log(require('crypto').randomUUID())"

# Hash de senha (teste)
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('senha123', 10))"

# Verificar senha (teste)
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.compareSync('senha123', '$2a$10$...'))"
```

---

## 🗑️ LIMPEZA

```powershell
# Limpar tudo
Remove-Item -Recurse -Force node_modules, dist, build, .next

# Limpar banco (Docker)
docker rm -f quadro-postgres

# Limpar backups antigos
Get-ChildItem -Path . -Filter "*.backup" | Remove-Item

# Limpar logs
Remove-Item -Path "*.log"
```

---

## 📝 GIT

```powershell
# Inicializar repo
git init
git add .
git commit -m "feat: migração completa para PostgreSQL + Auth JWT"

# Criar branch
git checkout -b feature/nova-funcionalidade

# Voltar para main
git checkout main

# Push
git remote add origin https://github.com/usuario/repo.git
git push -u origin main
```

---

## 🎯 ATALHOS ÚTEIS

```powershell
# Criar alias (adicionar no $PROFILE)
function dev { npm run dev }
function db { npx prisma studio }
function migrate { npx prisma migrate dev }
function seed { npm run db:seed }
function logs { docker logs -f quadro-postgres }

# Recarregar profile
. $PROFILE
```

---

## 🆘 EMERGÊNCIA

### Servidor travado
```powershell
# Matar processo na porta 3000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

### Banco corrompido
```powershell
# Resetar tudo
docker rm -f quadro-postgres
docker run --name quadro-postgres -e POSTGRES_PASSWORD=senha123 -p 5432:5432 -d postgres:15
npx prisma db push
npm run db:seed
```

### Frontend quebrado
```powershell
# Limpar cache do navegador
# Ctrl+Shift+Delete (Chrome/Edge)

# Limpar localStorage
# Console: localStorage.clear()
```

### Erro "Cannot find module"
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 📞 REFERÊNCIAS RÁPIDAS

- **Prisma Docs**: https://www.prisma.io/docs
- **Express Docs**: https://expressjs.com
- **Socket.IO Docs**: https://socket.io/docs
- **JWT.io**: https://jwt.io
- **PostgreSQL Docs**: https://www.postgresql.org/docs

---

**Salve este arquivo como referência rápida! 📌**
