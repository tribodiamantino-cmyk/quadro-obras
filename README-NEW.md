# 📊 Quadro de Obras - Sistema de Gerenciamento v2.0

Sistema profissional de gerenciamento de obras com Kanban, GSI, auditoria completa e controle de usuários.

![Status](https://img.shields.io/badge/status-production-success)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)

---

## ⚡ INÍCIO RÁPIDO

```powershell
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
copy .env.example .env
# Edite .env com suas credenciais Supabase

# 3. Iniciar com hot reload
npm run dev

# 4. Acessar
# http://localhost:4000
```

**📖 Guia detalhado**: [INICIO-RAPIDO.md](INICIO-RAPIDO.md)

---

## ✨ FEATURES

### 🎯 Gerenciamento de Obras
- ✅ Kanban drag & drop fluído e otimizado
- ✅ 5 status configuráveis: Criado → Em separação → Pendência → Romaneio → Entregue
- ✅ Filtros avançados (loja, status, cliente, categoria)
- ✅ Categorização (reforma, nova loja, manutenção, etc)
- ✅ Datas de início e previsão de entrega
- ✅ Arquivamento de obras concluídas

### 📦 Controle GSI (Entrega)
- ✅ Data prevista de entrega GSI
- ✅ Data efetiva de chegada
- ✅ Botão de validação rápida
- ✅ Indicadores visuais de status

### 👥 Sistema de Usuários
- ✅ 3 níveis de acesso: Admin, Membro, Visualizador
- ✅ Cadastro e gestão de usuários
- ✅ Ativação/desativação de contas
- ✅ Autenticação JWT segura

### 📋 Auditoria Completa
- ✅ Log de todas as ações (criar, editar, deletar, arquivar)
- ✅ Rastreamento de login/logout
- ✅ Histórico completo com usuário, data e IP
- ✅ Filtros por usuário, ação e entidade

### 🔄 Real-time
- ✅ Sincronização via WebSocket
- ✅ Atualizações instantâneas entre usuários
- ✅ Notificações visuais de mudanças

### ⚡ Performance
- ✅ Otimistic UI (600ms → 80ms)
- ✅ Debounce em buscas (800ms)
- ✅ Throttle em filtros (300ms)
- ✅ 60% menos chamadas à API

---

## 🛠️ TECNOLOGIAS

### Backend
- **Node.js + Express** - Servidor API REST
- **Supabase** - Banco PostgreSQL + Auth
- **Socket.io** - Real-time sync
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

### Frontend
- **Vanilla JavaScript** - Zero frameworks, máxima performance
- **Drag & Drop API** - Nativa do browser
- **CSS Grid/Flexbox** - Layout responsivo
- **WebSocket** - Comunicação real-time

---

## 📂 ESTRUTURA DO PROJETO

```
quadro-obras-testes/
├── 📚 Documentação
│   ├── INICIO-RAPIDO.md        ← Guia de início
│   ├── README.md               ← Este arquivo
│   └── EXECUTAR-SISTEMA.md     ← Setup detalhado
│
├── 🔧 Configuração
│   ├── package.json            ← Dependências e scripts
│   ├── nodemon.json            ← Config hot reload
│   ├── .env.example            ← Template de variáveis
│   └── .gitignore              ← Arquivos ignorados
│
├── 🤖 Scripts
│   ├── setup-git.ps1           ← Configurar Git Flow
│   ├── deploy.ps1              ← Deploy inteligente
│   └── scripts/
│       ├── backup-database.js  ← Backup automático
│       └── view-logs.js        ← Visualizar logs
│
├── ⚙️ Backend
│   ├── server-supabase.js      ← Servidor principal
│   └── src/
│       ├── config/             ← Configurações
│       ├── controllers/        ← Lógica de negócio
│       ├── middleware/         ← Auth, validação
│       └── routes/             ← Rotas da API
│
├── 🎨 Frontend
│   └── public/
│       ├── index.html          ← Dashboard
│       ├── login.html          ← Login/Registro
│       ├── settings.html       ← Configurações
│       ├── app-simple.js       ← Lógica principal
│       ├── settings.js         ← Config/Usuários
│       └── style.css           ← Estilos
│
└── 🗄️ Banco de Dados
    ├── supabase-setup.sql      ← Setup completo
    ├── supabase-migrations.sql ← Migrações
    └── supabase-audit-logs.sql ← Sistema de auditoria
```

---

## 🚀 SCRIPTS NPM

| Script | Comando | Descrição |
|--------|---------|-----------|
| 🔥 **Desenvolvimento** | `npm run dev` | Hot reload automático (recomendado!) |
| 🚀 **Produção** | `npm start` | Servidor modo produção |
| 🧪 **Teste** | `npm test` | Verificação básica |
| 💾 **Backup** | `npm run backup` | Backup automático do banco |
| 📋 **Logs** | `npm run logs` | Ver logs de auditoria |

---

## 🌳 GIT WORKFLOW

### Estrutura de Branches

```
main (produção)
  ↑
  └── staging (homologação)
        ↑
        └── development
              ↑
              └── feature/nome-da-feature
```

### Setup Inicial

```powershell
# Configurar Git Flow (execute 1x)
.\setup-git.ps1
```

### Desenvolver Feature

```powershell
# 1. Criar branch
git checkout development
git checkout -b feature/minha-feature

# 2. Desenvolver com hot reload
npm run dev

# 3. Commitar
git add .
git commit -m "feat: descrição da feature"

# 4. Integrar
git checkout development
git merge feature/minha-feature
```

### Deploy

```powershell
# Staging
git checkout staging
git merge development
.\deploy.ps1 staging

# Produção (após testar!)
git checkout main
git merge staging
.\deploy.ps1 production
```

---

## 🔐 CONFIGURAÇÃO

### 1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Vá em **Settings → API**
4. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_KEY`

### 2. Configurar Banco de Dados

Execute os scripts SQL no **SQL Editor** do Supabase (nesta ordem):

1. `supabase-setup.sql` - Cria todas as tabelas
2. `supabase-migrations.sql` - Migrações necessárias
3. `supabase-audit-logs.sql` - Sistema de auditoria

### 3. Configurar Variáveis de Ambiente

```powershell
# Copiar template
copy .env.example .env

# Editar .env
notepad .env
```

```env
PORT=4000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-aqui
JWT_SECRET=gere-algo-aleatorio-forte
NODE_ENV=development
```

### 4. Instalar e Iniciar

```powershell
npm install
npm run dev
```

---

## 📊 API ENDPOINTS

### Autenticação
```
POST   /api/auth/register      - Registrar usuário
POST   /api/auth/login         - Login
POST   /api/auth/logout        - Logout
GET    /api/auth/me            - Usuário atual
```

### Projetos/Obras
```
GET    /api/projects           - Listar obras
POST   /api/projects           - Criar obra
PUT    /api/projects/:id       - Editar obra
DELETE /api/projects/:id       - Deletar obra
PATCH  /api/projects/:id/archive - Arquivar
PATCH  /api/projects/:id/restore - Restaurar
```

### Usuários (Admin)
```
GET    /api/users              - Listar usuários
POST   /api/users              - Criar usuário
PUT    /api/users/:id          - Editar usuário
```

### Logs
```
GET    /api/audit-logs         - Logs de auditoria
```

### Configurações
```
GET    /api/settings/*         - Lojas, status, etc
```

---

## 🎨 CUSTOMIZAÇÃO

### Adicionar Novo Status

1. No Supabase (tabela `work_statuses`):
```sql
INSERT INTO work_statuses (name, color, "order", organization_id)
VALUES ('Novo Status', '#color', 6, 'org-id');
```

2. Atualizar constraints se necessário:
```sql
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN ('Criado', 'Em separação', 'Pendencia', 'Em romaneio', 'Entregue', 'Novo Status'));
```

### Adicionar Nova Categoria

Edite `public/app-simple.js`:
```javascript
const categories = [
  { value: 'nova-categoria', label: 'Nova Categoria' }
];
```

---

## 🐛 TROUBLESHOOTING

### Servidor não inicia

```powershell
# Matar processos Node
Stop-Process -Name node -Force

# Tentar novamente
npm run dev
```

### Erro de conexão Supabase

1. Verifique `.env`:
   - `SUPABASE_URL` está correto?
   - `SUPABASE_KEY` está correto?
2. Teste conexão:
   ```powershell
   node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
   ```

### Hot reload não funciona

```powershell
# Reinstalar nodemon
npm install --save-dev nodemon

# Limpar cache
npm cache clean --force
npm install
```

### Banco corrompido

```powershell
# Fazer backup primeiro
npm run backup

# Restaurar estrutura
# Execute supabase-setup.sql novamente
```

---

## 📈 PERFORMANCE

### Métricas de Otimização

| Ação | Antes | Depois | Melhoria |
|------|-------|--------|----------|
| Drag & Drop | 600ms | 80ms | **7.5x mais rápido** |
| Chamadas API | 100% | 40% | **60% menos requests** |
| Filtros | Lag visível | Instantâneo | **Debounce 800ms** |

### Técnicas Utilizadas

- ✅ **Optimistic UI** - Atualiza interface antes da API
- ✅ **Debounce** - Aguarda usuário parar de digitar (800ms)
- ✅ **Throttle** - Limita frequência de filtros (300ms)
- ✅ **Selective DOM Updates** - Atualiza apenas o necessário

---

## 🚀 DEPLOY (Railway)

### 1. Preparar Repositório

```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/quadro-obras.git
git push -u origin main
```

### 2. Configurar Railway

1. Acesse [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Selecione repositório
4. Configure variáveis em **Variables**:
   ```
   PORT=4000
   JWT_SECRET=gere-algo-forte
   SUPABASE_URL=sua-url-prod
   SUPABASE_KEY=sua-key-prod
   NODE_ENV=production
   ```
5. Deploy automático ao push em `main`

### 3. Deploy com Script

```powershell
.\deploy.ps1 production
```

---

## 🔒 SEGURANÇA

- ✅ Senhas com bcrypt (salt rounds: 10)
- ✅ JWT para autenticação
- ✅ Validação de inputs (express-validator)
- ✅ CORS configurado
- ✅ Variáveis de ambiente protegidas
- ✅ Logs de auditoria completos
- ✅ Role-based access control (RBAC)

---

## 📝 LICENÇA

Propriedade privada. Todos os direitos reservados.

---

## 👥 CONTRIBUINDO

1. Fork o projeto
2. Crie feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit mudanças (`git commit -m 'feat: Add amazing feature'`)
4. Push para branch (`git push origin feature/AmazingFeature`)
5. Abra Pull Request

---

## 📞 SUPORTE

- 📧 Email: seu-email@empresa.com
- 📱 WhatsApp: (XX) XXXXX-XXXX
- 🌐 Site: https://sua-empresa.com.br

---

## 🎯 ROADMAP

### v2.1 (Próxima)
- [ ] Dashboard com gráficos
- [ ] Exportação para PDF/Excel
- [ ] Notificações por email
- [ ] App mobile (PWA)

### v2.2
- [ ] Integração com WhatsApp
- [ ] Gestão de documentos
- [ ] Timeline de obras
- [ ] Módulo financeiro

---

## 🙏 AGRADECIMENTOS

- **Supabase** - Backend as a Service incrível
- **Railway** - Deploy simples e eficiente
- **Socket.io** - Real-time sem complicações
- **GitHub Copilot** - Pair programming IA

---

<div align="center">

**Feito com ❤️ para gestão eficiente de obras**

[⬆️ Voltar ao topo](#-quadro-de-obras---sistema-de-gerenciamento-v20)

</div>
