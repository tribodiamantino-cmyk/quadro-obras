# ⚡ COMANDOS FAVORITOS - CTRL+C / CTRL+V

## 🔥 DESENVOLVIMENTO

```powershell
# Iniciar com hot reload (melhor opção!)
npm run dev

# Reiniciar servidor limpo
Stop-Process -Name node -Force; npm run dev
```

## 🗄️ BANCO DE DADOS

```powershell
# Backup rápido
npm run backup

# Ver logs recentes
npm run logs
```

## 🌳 GIT - NOVA FEATURE

```powershell
# Setup inicial (só 1x)
.\setup-git.ps1

# Criar feature
git checkout development
git checkout -b feature/nome-descritivo

# Commitar
git add .
git commit -m "feat: descrição clara"

# Integrar
git checkout development
git merge feature/nome-descritivo
git branch -d feature/nome-descritivo
git push origin development
```

## 🚀 DEPLOY

```powershell
# Deploy staging
git checkout staging
git merge development
.\deploy.ps1 staging

# Deploy produção (com verificações!)
git checkout main
git merge staging
.\deploy.ps1 production
```

## 🐛 TROUBLESHOOTING

```powershell
# Matar Node e limpar
Stop-Process -Name node -Force
npm cache clean --force
npm install

# Ver processos Node rodando
Get-Process node

# Testar conexão Supabase
node -e "require('dotenv').config(); const {createClient} = require('@supabase/supabase-js'); const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY); s.from('projects').select('count').then(r => console.log('✅ Conectado!', r)).catch(e => console.log('❌ Erro:', e.message))"
```

## 📂 NAVEGAÇÃO RÁPIDA

```powershell
# Abrir VS Code
code .

# Abrir arquivo específico
code public/app-simple.js
code server-supabase.js
code .env

# Abrir pasta no Explorer
explorer .
explorer backup
```

## 🔄 GIT ÚTEIS

```powershell
# Ver status
git status

# Ver logs bonitos
git log --oneline --graph --all -10

# Ver diferenças
git diff
git diff development..staging

# Desfazer último commit (mantém código)
git reset --soft HEAD~1

# Desfazer merge
git merge --abort

# Atualizar branch
git pull origin main

# Ver branches
git branch -a
```

## 📊 INFORMAÇÕES

```powershell
# Ver versão Node
node --version

# Ver pacotes instalados
npm list --depth=0

# Ver scripts disponíveis
npm run

# Ver porta em uso
netstat -ano | findstr :4000
```

## 🔒 SEGURANÇA

```powershell
# Gerar JWT Secret forte
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Gerar UUID
node -e "console.log(require('crypto').randomUUID())"

# Hash de senha (bcrypt)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('senha123', 10).then(h => console.log(h))"
```

## 📦 NPM

```powershell
# Instalar dependência
npm install nome-do-pacote

# Instalar dev dependency
npm install --save-dev nome-do-pacote

# Atualizar pacotes
npm update

# Verificar updates disponíveis
npm outdated

# Limpar cache
npm cache clean --force
```

## 🗄️ SUPABASE SQL (copiar e colar no SQL Editor)

```sql
-- Ver total de obras
SELECT COUNT(*) as total FROM projects;

-- Ver obras por status
SELECT status, COUNT(*) as total 
FROM projects 
GROUP BY status 
ORDER BY COUNT(*) DESC;

-- Ver obras recentes
SELECT name, client_name, status, created_at 
FROM projects 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver usuários ativos
SELECT name, email, role 
FROM users 
WHERE active = true;

-- Ver logs recentes
SELECT 
  u.name as usuario,
  al.action,
  al.entity_type,
  al.created_at
FROM audit_logs al
LEFT JOIN users u ON u.id = al.user_id
ORDER BY al.created_at DESC
LIMIT 20;

-- Backup rápido (criar tabela temporária)
CREATE TABLE backup_projects_hoje AS SELECT * FROM projects;
CREATE TABLE backup_tasks_hoje AS SELECT * FROM tasks;

-- Limpar logs antigos (+ de 90 dias)
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## 🎨 COPILOT PROMPTS

```
// Criar função para filtrar obras por período
// Adicionar validação de email
// Otimizar query do banco de dados
// Adicionar loading state durante fetch
// Criar componente de modal reutilizável
// Adicionar testes unitários para esta função
// Refatorar este código para melhor legibilidade
// Adicionar documentação JSDoc
```

## 🔥 ONE-LINERS ÚTEIS

```powershell
# Backup + Deploy produção em sequência
npm run backup; git checkout main; git merge staging; git push origin main

# Resetar ambiente dev
Stop-Process -Name node -Force; rm .env; cp .env.example .env; npm run dev

# Ver tamanho dos arquivos
Get-ChildItem -Recurse | Measure-Object -Property Length -Sum | Select-Object @{Name="Size (MB)"; Expression={"{0:N2}" -f ($_.Sum / 1MB)}}

# Contar linhas de código
(Get-Content -Path (Get-ChildItem -Recurse -Include *.js,*.html,*.css)).Count
```

---

**💡 Dica**: Adicione este arquivo aos favoritos do navegador para acesso rápido!
