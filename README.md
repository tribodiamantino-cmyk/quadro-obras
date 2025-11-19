# 🛠️ Quadro de Obras - Sistema de Gestão v1.0# 🛠️ Quadro de Acompanhamento de Obras - v2.0



Sistema completo de gestão de obras com controle de tarefas, usuários e integração em tempo real.Sistema completo de gerenciamento de obras com autenticação multi-tenant, controle de usuários e banco de dados PostgreSQL.



## 🚀 Deploy em Produção## 🚀 Principais Funcionalidades



**URL:** https://quadro-obras-production.up.railway.app✅ **Autenticação JWT** - Sistema seguro de login/registro  

✅ **Multi-tenant** - Múltiplas organizações isoladas  

**Credenciais:** `admin@admin.com` / `admin123`✅ **Controle de Acesso** - Roles: ADMIN, MEMBER, VIEWER  

✅ **PostgreSQL** - Banco de dados robusto e escalável  

## ✨ Funcionalidades✅ **Real-time** - Atualizações ao vivo via Socket.IO  

✅ **Kanban** - Quadro visual de tarefas  

- ✅ Gestão completa de projetos e tarefas✅ **Histórico** - Rastreamento completo de mudanças  

- ✅ Sistema Kanban com 5 status

- ✅ Gerenciamento de usuários (3 níveis)---

- ✅ Atualização em tempo real

- ✅ Logs de auditoria## 📋 Pré-requisitos

- ✅ Multi-tenant

- **Node.js** 18+ ([Download](https://nodejs.org/))

## 📦 Instalação- **PostgreSQL** 14+ ou conta em:

  - [Supabase](https://supabase.com) (recomendado - grátis)

```bash  - [Neon](https://neon.tech) (alternativa grátis)

npm install  - Docker local

cp .env.example .env

# Configure .env---

npm run dev

```## ⚡ Quick Start



## 🔧 Tecnologias### 1️⃣ Instalar Dependências



- Node.js + Express```bash

- Supabase (PostgreSQL)npm install

- Socket.IO```

- JWT

### 2️⃣ Configurar Banco de Dados

## 📝 Scripts

#### Opção A: Supabase (Recomendado)

```bash

npm start                    # Produção1. Criar conta em https://supabase.com

npm run dev                  # Desenvolvimento  2. Criar novo projeto

node scripts/add-user.js     # Adicionar usuário3. Copiar a **Connection String** em: `Settings > Database > Connection string > URI`

```4. Substituir `[YOUR-PASSWORD]` pela senha do projeto



Veja documentação completa em `docs/````bash

# Exemplo de URL do Supabase
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres"
```

#### Opção B: PostgreSQL Local (Docker)

```bash
# Subir PostgreSQL via Docker
docker run --name quadro-postgres -e POSTGRES_PASSWORD=senha123 -p 5432:5432 -d postgres:15

# Criar banco
docker exec -it quadro-postgres psql -U postgres -c "CREATE DATABASE quadro_obras;"
```

### 3️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env e adicionar sua DATABASE_URL
```

**Exemplo de `.env`:**

```bash
PORT=3000
NODE_ENV=development

# Sua URL do PostgreSQL
DATABASE_URL="postgresql://postgres:senha123@localhost:5432/quadro_obras?schema=public"

# Gere um secret seguro (use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=seu_secret_super_seguro_aqui_mude_isso

JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### 4️⃣ Rodar Migrações do Prisma

```bash
# Cria as tabelas no banco
npm run db:push

# OU (para desenvolvimento com histórico de migrations)
npm run db:migrate
```

### 5️⃣ Popular Banco com Dados

#### Opção A: Migrar dados do `db.json` antigo

```bash
node prisma/migrate-from-json.js
```

Isso vai:
- Ler seu `db.json` atual
- Criar uma organização
- Criar um usuário admin (`admin@empresa.com` / `admin123`)
- Migrar todos os projetos e tarefas
- Fazer backup do `db.json`

#### Opção B: Criar dados de exemplo

```bash
npm run db:seed
```

Cria:
- 2 organizações de exemplo
- 3 usuários (ADMIN, MEMBER, VIEWER)
- 2 projetos com tarefas

### 6️⃣ Iniciar Servidor

```bash
# Produção
npm start

# Desenvolvimento (com auto-reload)
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🔐 Autenticação

### Registrar Nova Organização

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@minhaempresa.com",
  "password": "senha_segura_123",
  "name": "João Silva",
  "organizationName": "Minha Construtora Ltda"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx...",
    "email": "admin@minhaempresa.com",
    "name": "João Silva",
    "role": "ADMIN",
    "organizationId": "clx...",
    "organizationName": "Minha Construtora Ltda",
    "organizationSlug": "minha-construtora-ltda"
  }
}
```

### Fazer Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@minhaempresa.com",
  "password": "senha_segura_123"
}
```

### Usar Token nas Requests

```bash
GET /api/state
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 👥 Roles e Permissões

| Role | Criar/Editar | Deletar | Convidar Usuários |
|------|--------------|---------|-------------------|
| **ADMIN** | ✅ | ✅ | ✅ |
| **MEMBER** | ✅ | ✅ | ❌ |
| **VIEWER** | ❌ | ❌ | ❌ |

---

## 📡 API Endpoints

### Auth

```
POST   /api/auth/register      - Criar nova organização + admin
POST   /api/auth/login         - Fazer login
GET    /api/auth/me            - Dados do usuário autenticado
POST   /api/auth/invite        - Convidar usuário (ADMIN only)
```

### Projects

```
GET    /api/state              - Buscar todos os projetos e tarefas
POST   /api/project            - Criar projeto
PATCH  /api/project/:id        - Atualizar projeto
DELETE /api/project/:id        - Deletar projeto (ADMIN only)
```

### Tasks

```
POST   /api/task               - Criar tarefa
PATCH  /api/task/:id           - Atualizar tarefa
DELETE /api/task/:id           - Deletar tarefa
POST   /api/task/:id/duplicate-pending
POST   /api/task/:id/advance-with-pending
POST   /api/tasks/batch-copy
POST   /api/tasks/batch-delete
```

---

## 🗄️ Comandos Úteis do Prisma

```bash
# Ver banco no navegador
npm run db:studio

# Criar migration
npm run db:migrate

# Aplicar schema sem migration
npm run db:push

# Popular banco
npm run db:seed

# Resetar banco (CUIDADO!)
npx prisma migrate reset
```

---

## 🐳 Deploy com Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build
docker build -t quadro-obras .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  quadro-obras
```

---

## 🌍 Deploy em Produção

### Vercel (Recomendado)

1. Conectar repositório no Vercel
2. Adicionar variáveis de ambiente:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
3. Deploy automático! ✨

### Railway

```bash
# Instalar CLI
npm i -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

### Render

1. Criar Web Service
2. Conectar repo
3. Build: `npm install && npx prisma generate && npx prisma db push`
4. Start: `npm start`

---

## 🔧 Troubleshooting

### Erro: "Environment variable not found: DATABASE_URL"

```bash
# Certifique-se que o .env existe e está correto
cat .env

# Regenerar Prisma Client
npx prisma generate
```

### Erro: "Can't reach database server"

```bash
# Teste a conexão
npx prisma db pull

# Verifique se PostgreSQL está rodando
docker ps  # se usando Docker
```

### Erro: "Invalid token" no frontend

- Verifique se o token está sendo enviado no header `Authorization: Bearer TOKEN`
- Certifique-se que `JWT_SECRET` é o mesmo em todos os ambientes
- Token pode ter expirado (padrão: 7 dias)

---

## 📊 Estrutura do Projeto

```
quadro-obras/
├── prisma/
│   ├── schema.prisma           # Definição do banco
│   ├── seed.js                 # Dados de exemplo
│   └── migrate-from-json.js    # Migração do db.json antigo
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── projects.controller.js
│   ├── middleware/
│   │   └── auth.js             # JWT middleware
│   └── routes/
│       ├── auth.routes.js
│       └── projects.routes.js
├── public/
│   ├── index.html
│   ├── app.js                  # Frontend
│   └── style.css
├── server-new.js               # Servidor principal
├── package.json
└── .env                        # Variáveis de ambiente
```

---

## 🔄 Migração da Versão Antiga

Se você já tem dados no `db.json`:

```bash
# 1. Fazer backup
cp db.json db.json.backup

# 2. Rodar migração
node prisma/migrate-from-json.js

# 3. Verificar dados
npm run db:studio

# 4. Renomear server
mv server.js server-old.js
mv server-new.js server.js

# 5. Reiniciar
npm start
```

**Credenciais padrão após migração:**
- Email: `admin@empresa.com`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Altere a senha após primeiro login!

---

## 🆘 Suporte

- **Problemas?** Abra uma issue
- **Dúvidas?** Consulte a documentação do [Prisma](https://www.prisma.io/docs)

---

## 📝 Licença

Privado - Uso interno

---

## ✨ Próximas Features

- [ ] Sistema de notificações
- [ ] Upload de anexos
- [ ] Relatórios em PDF
- [ ] App mobile (React Native)
- [ ] Integração com WhatsApp
- [ ] Dashboard analytics

---

**Desenvolvido com ❤️ para gerenciamento de obras**
