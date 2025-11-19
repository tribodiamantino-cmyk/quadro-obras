# 🎯 MENU PRINCIPAL - QUADRO DE OBRAS

## 📚 DOCUMENTAÇÃO (Escolha o que precisa)

| Se você quer... | Abra este arquivo |
|-----------------|-------------------|
| 🚀 **Começar AGORA** | [INICIO-RAPIDO.md](INICIO-RAPIDO.md) |
| 📖 **Documentação completa** | [README-NEW.md](README-NEW.md) |
| ⚡ **Copiar comandos úteis** | [COMANDOS-FAVORITOS.md](COMANDOS-FAVORITOS.md) |
| ✅ **Ver o que foi feito** | [RESUMO-CONFIGURACAO.md](RESUMO-CONFIGURACAO.md) |
| 🔧 **Executar pela primeira vez** | [EXECUTAR-SISTEMA.md](EXECUTAR-SISTEMA.md) |

---

## ⚡ COMANDOS MAIS USADOS

```powershell
# 🔥 DESENVOLVIMENTO (com hot reload!)
npm run dev

# 🚀 PRODUÇÃO
npm start

# 💾 BACKUP
npm run backup

# 📋 LOGS
npm run logs

# 🌳 SETUP GIT (1x apenas)
.\setup-git.ps1

# 🚀 DEPLOY
.\deploy.ps1 production
```

---

## 🎯 FLUXOS RÁPIDOS

### 🆕 Primeira Vez

```powershell
npm install
.\setup-git.ps1
copy .env.example .env
# Edite .env com suas credenciais
npm run dev
```

### 💻 Desenvolver Feature

```powershell
git checkout -b feature/nome
npm run dev
# ... desenvolva ...
git add .
git commit -m "feat: descrição"
git checkout development
git merge feature/nome
```

### 🚀 Deploy Produção

```powershell
npm run backup
git checkout main
git merge staging
.\deploy.ps1 production
```

---

## 📂 ESTRUTURA

```
📁 quadro-obras-testes/
│
├── 📚 Docs                    ← Leia quando precisar
│   ├── MENU.md               ← Você está aqui!
│   ├── INICIO-RAPIDO.md      ← Referência rápida
│   ├── README-NEW.md         ← Documentação completa
│   ├── COMANDOS-FAVORITOS.md ← Ctrl+C / Ctrl+V
│   └── RESUMO-CONFIGURACAO.md← O que foi feito
│
├── 🤖 Scripts                 ← Execute quando precisar
│   ├── setup-git.ps1         ← Git Flow (1x)
│   ├── deploy.ps1            ← Deploy inteligente
│   └── scripts/
│       ├── backup-database.js
│       └── view-logs.js
│
├── ⚙️ Backend                 ← Código do servidor
│   ├── server-supabase.js
│   └── src/
│
└── 🎨 Frontend                ← Interface web
    └── public/
```

---

## 🎓 APRENDA POR OBJETIVO

### Quero rodar o sistema local
→ [INICIO-RAPIDO.md](INICIO-RAPIDO.md) - Seção "Desenvolvimento"

### Quero criar uma nova funcionalidade
→ [INICIO-RAPIDO.md](INICIO-RAPIDO.md) - Seção "Desenvolver Feature"

### Quero fazer deploy em produção
→ [README-NEW.md](README-NEW.md) - Seção "Deploy (Railway)"

### Quero entender a API
→ [README-NEW.md](README-NEW.md) - Seção "API Endpoints"

### Quero fazer backup
→ `npm run backup`

### Quero ver logs
→ `npm run logs`

### Algo não funciona
→ [README-NEW.md](README-NEW.md) - Seção "Troubleshooting"

---

## 🔥 RECURSOS ESPECIAIS

### ⚡ Hot Reload
Código atualiza automaticamente ao salvar!
```powershell
npm run dev
```

### 🛡️ Deploy Seguro
Verificações automáticas antes de deploy
```powershell
.\deploy.ps1 production
```

### 💾 Backup 1-Click
Backup completo do banco em JSON
```powershell
npm run backup
```

### 📋 Logs Visualizáveis
Ver últimas 50 ações do sistema
```powershell
npm run logs
```

---

## 🎯 PRÓXIMO PASSO

**Se é sua primeira vez:**
```powershell
npm run dev
```

**Se já configurou:**
```powershell
git checkout -b feature/minha-feature
npm run dev
```

---

## 💡 DICA

Mantenha este arquivo (`MENU.md`) aberto em uma aba!

Use como **índice rápido** para encontrar o que precisa.

---

<div align="center">

**🚀 Pronto para começar!**

[Início Rápido](INICIO-RAPIDO.md) | [Documentação](README-NEW.md) | [Comandos](COMANDOS-FAVORITOS.md)

</div>
