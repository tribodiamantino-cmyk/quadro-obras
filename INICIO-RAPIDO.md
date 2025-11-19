# 🚀 GUIA RÁPIDO - QUADRO DE OBRAS v2.0

## ⚡ COMANDOS ESSENCIAIS

### Desenvolvimento

```powershell
# Iniciar com hot reload (recarrega automaticamente!)
npm run dev

# Modo produção
npm start

# Ver logs do sistema
npm run logs

# Fazer backup do banco
npm run backup
```

### Git Workflow

```powershell
# Setup inicial (execute 1x)
.\setup-git.ps1

# Criar nova feature
git checkout development
git checkout -b feature/nome-da-feature

# Commitar alterações
git add .
git commit -m "feat: descrição"

# Deploy staging
git checkout staging
git merge development
.\deploy.ps1 staging

# Deploy produção
git checkout main
git merge staging
.\deploy.ps1 production
```

---

## 📂 ESTRUTURA DO PROJETO

```
quadro-obras-testes/
├── 📄 INICIO-RAPIDO.md          ← VOCÊ ESTÁ AQUI
├── 📄 README.md                 ← Documentação principal
│
├── 🔧 Scripts de Desenvolvimento
│   ├── setup-git.ps1           ← Configurar Git Flow
│   ├── deploy.ps1              ← Deploy inteligente
│   ├── package.json            ← Scripts npm
│   └── nodemon.json            ← Config hot reload
│
├── 🛠️ Scripts Úteis
│   └── scripts/
│       ├── backup-database.js  ← Backup automático
│       └── view-logs.js        ← Ver logs de auditoria
│
├── 🎨 Frontend
│   └── public/
│       ├── index.html          ← Dashboard principal
│       ├── app-simple.js       ← Lógica principal
│       ├── settings.html       ← Configurações
│       └── style.css           ← Estilos
│
├── ⚙️ Backend
│   ├── server-supabase.js      ← Servidor principal
│   └── src/
│       ├── controllers/        ← Lógica de negócio
│       ├── routes/             ← Rotas da API
│       └── middleware/         ← Autenticação, etc
│
└── 🗄️ Banco de Dados
    ├── supabase-setup.sql      ← Setup inicial
    ├── supabase-migrations.sql ← Migrações
    └── supabase-audit-logs.sql ← Sistema de logs
```

---

## 🎯 WORKFLOWS COMUNS

### 1. Primeira vez no projeto

```powershell
# 1. Instalar dependências
npm install

# 2. Configurar Git
.\setup-git.ps1

# 3. Criar .env
# Copie .env.example para .env
# Adicione suas credenciais Supabase

# 4. Iniciar desenvolvimento
npm run dev
```

### 2. Desenvolver nova feature

```powershell
# 1. Criar branch
git checkout development
git checkout -b feature/filtro-avancado

# 2. Desenvolver com hot reload
npm run dev
# Código recarrega automaticamente ao salvar!

# 3. Testar
# Acesse http://localhost:4000

# 4. Commitar
git add .
git commit -m "feat: adiciona filtro avançado"

# 5. Integrar
git checkout development
git merge feature/filtro-avancado
git branch -d feature/filtro-avancado
```

### 3. Fazer deploy

```powershell
# Staging (teste)
git checkout staging
git merge development
.\deploy.ps1 staging

# Produção (após testar!)
git checkout main
git merge staging
.\deploy.ps1 production
```

### 4. Backup antes de mudanças importantes

```powershell
# Backup automático
npm run backup

# Salva em: backup/backup-YYYY-MM-DD.json
```

### 5. Ver o que aconteceu no sistema

```powershell
# Ver últimas 50 ações
npm run logs

# Mostra:
# - Quem fez
# - O que fez
# - Quando fez
```

---

## 🌳 ESTRUTURA DE BRANCHES

```
main (produção)
  ├── Railway faz deploy automático
  └── NUNCA commite direto aqui!

staging (homologação)
  ├── Testa antes de produção
  └── Merge de development

development
  ├── Desenvolvimento ativo
  └── Merge de features

feature/nome
  ├── Feature isolada
  └── Deleta após merge
```

---

## 💡 DICAS PROFISSIONAIS

### Hot Reload

```powershell
# Use npm run dev em vez de npm start!
npm run dev

# Benefícios:
# ✅ Recarrega ao salvar arquivo
# ✅ Não precisa reiniciar servidor
# ✅ Desenvolvimento muito mais rápido!
```

### Commits Semânticos

```powershell
# Use prefixos nas mensagens:

git commit -m "feat: adiciona botão exportar"     # Nova feature
git commit -m "fix: corrige drag and drop"        # Correção
git commit -m "refactor: otimiza filtros"         # Melhoria
git commit -m "docs: atualiza README"             # Documentação
git commit -m "style: ajusta cores header"        # Visual
```

### Deploy Seguro

```powershell
# SEMPRE faça nesta ordem:
# 1. Teste em development
# 2. Teste em staging
# 3. Deploy em main

# Use o script de deploy:
.\deploy.ps1 production

# Ele verifica:
# ✅ Branch correta
# ✅ Sem alterações pendentes
# ✅ Código atualizado
# ✅ Testes passando
```

---

## 🆘 PROBLEMAS COMUNS

### Servidor não inicia

```powershell
# Verifique se a porta está ocupada
Stop-Process -Name node -Force
npm run dev
```

### Hot reload não funciona

```powershell
# Reinstale nodemon
npm install --save-dev nodemon
npm run dev
```

### Erro de merge

```powershell
# Desfazer merge
git merge --abort

# Ou resolver conflitos manualmente:
# 1. Abra arquivos com conflito
# 2. Escolha o código correto
# 3. Remova marcadores (<<<<, ====, >>>>)
# 4. git add .
# 5. git commit
```

### Banco de dados corrompido

```powershell
# Restaurar backup
# 1. Veja backups disponíveis
ls backup/

# 2. Use o migrate-json.js modificado
# ou restaure manualmente no Supabase
```

---

## 📊 SCRIPTS DISPONÍVEIS

| Script | Comando | Descrição |
|--------|---------|-----------|
| **Desenvolvimento** | `npm run dev` | Hot reload (recomendado!) |
| **Produção** | `npm start` | Servidor normal |
| **Testes** | `npm test` | Verificação básica |
| **Backup** | `npm run backup` | Backup automático |
| **Logs** | `npm run logs` | Ver auditoria |
| **Setup Git** | `.\setup-git.ps1` | Configurar branches |
| **Deploy** | `.\deploy.ps1 prod` | Deploy inteligente |

---

## 🎓 PRÓXIMOS PASSOS

### Imediato

1. ✅ Execute `npm run dev`
2. ✅ Acesse http://localhost:4000
3. ✅ Faça uma alteração e veja reload automático!

### Desenvolvimento

1. 📖 Leia README.md para detalhes
2. 🌳 Execute `.\setup-git.ps1`
3. 🚀 Crie sua primeira feature!

### Deploy

1. 🧪 Teste em staging
2. 📦 Faça backup: `npm run backup`
3. 🚀 Deploy: `.\deploy.ps1 production`

---

## ✨ RECURSOS BACANAS

- ⚡ **Hot Reload**: Código atualiza automaticamente
- 🔄 **Deploy Automático**: Push → Railway deploy
- 💾 **Backup 1-Click**: `npm run backup`
- 📋 **Logs Completos**: `npm run logs`
- 🛡️ **Deploy Seguro**: Verificações automáticas
- 🌳 **Git Flow**: Branches organizadas
- 📚 **Documentação**: Guias completos

---

## 🎉 ESTÁ TUDO PRONTO!

Seu ambiente está configurado profissionalmente! 

**Comandos essenciais que você vai usar todo dia:**

```powershell
npm run dev          # Desenvolver
git checkout -b      # Nova feature  
.\deploy.ps1 prod    # Deploy
npm run backup       # Backup
```

**Dúvidas?** Veja README.md ou arquivos de documentação!

🚀 **Bora codar!**
