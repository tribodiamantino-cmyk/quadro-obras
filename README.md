# 🏗️ Quadro de Obras - Sistema de Gestão v2.0# 🛠️ Quadro de Obras - Sistema de Gestão v1.0# 🛠️ Quadro de Acompanhamento de Obras - v2.0



Sistema completo de gerenciamento de obras com autenticação multi-tenant, controle de tarefas Kanban e atualizações em tempo real.



[![Deploy no Railway](https://img.shields.io/badge/Deploy-Railway-blueviolet)](https://controle-obras.up.railway.app/)Sistema completo de gestão de obras com controle de tarefas, usuários e integração em tempo real.Sistema completo de gerenciamento de obras com autenticação multi-tenant, controle de usuários e banco de dados PostgreSQL.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)](https://www.postgresql.org/)



---## 🚀 Deploy em Produção## 🚀 Principais Funcionalidades



## 🚀 Deploy em Produção



**URL:** https://controle-obras.up.railway.app/**URL:** https://quadro-obras-production.up.railway.app✅ **Autenticação JWT** - Sistema seguro de login/registro  



**Credenciais padrão:**✅ **Multi-tenant** - Múltiplas organizações isoladas  

- Email: `admin@admin.com`

- Senha: `admin123`**Credenciais:** `admin@admin.com` / `admin123`✅ **Controle de Acesso** - Roles: ADMIN, MEMBER, VIEWER  



---✅ **PostgreSQL** - Banco de dados robusto e escalável  



## ✨ Funcionalidades Principais## ✨ Funcionalidades✅ **Real-time** - Atualizações ao vivo via Socket.IO  



### 🔐 Autenticação & Autorização✅ **Kanban** - Quadro visual de tarefas  

- ✅ Sistema JWT seguro

- ✅ Multi-tenant (organizações isoladas)- ✅ Gestão completa de projetos e tarefas✅ **Histórico** - Rastreamento completo de mudanças  

- ✅ 3 níveis de acesso: ADMIN, MEMBER, VIEWER

- ✅ Convites por email- ✅ Sistema Kanban com 5 status



### 📊 Gestão de Obras- ✅ Gerenciamento de usuários (3 níveis)---

- ✅ Cadastro completo de projetos

- ✅ Filtros por loja, status, categoria- ✅ Atualização em tempo real

- ✅ Campo de busca instantânea

- ✅ Arquivamento de projetos- ✅ Logs de auditoria## 📋 Pré-requisitos

- ✅ Ordenação customizável (drag & drop)

- ✅ Multi-tenant

### 📋 Kanban de Tarefas

- ✅ 5 status: Criado → Em separação → Pendência → Em romaneio → Entregue- **Node.js** 18+ ([Download](https://nodejs.org/))

- ✅ Drag & drop entre colunas

- ✅ Botões de navegação rápida## 📦 Instalação- **PostgreSQL** 14+ ou conta em:

- ✅ Criação de pendências

- ✅ Histórico completo de movimentações  - [Supabase](https://supabase.com) (recomendado - grátis)



### ⚡ Real-time```bash  - [Neon](https://neon.tech) (alternativa grátis)

- ✅ Socket.IO para atualizações instantâneas

- ✅ Cache inteligente com invalidação automáticanpm install  - Docker local

- ✅ Sincronização entre múltiplos usuários

cp .env.example .env

### 📝 Detalhes de Obra

- ✅ Cliente, loja, status# Configure .env---

- ✅ Integrador, montador, eletricista

- ✅ Datas de início e previsão de entreganpm run dev

- ✅ Localização

- ✅ Campo de observações```## ⚡ Quick Start

- ✅ Categoria (Loja/GSI)



### 📈 Auditoria

- ✅ Logs de todas as ações## 🔧 Tecnologias### 1️⃣ Instalar Dependências

- ✅ Rastreamento de mudanças

- ✅ Histórico por projeto/tarefa



---- Node.js + Express```bash



## 📋 Pré-requisitos- Supabase (PostgreSQL)npm install



- **Node.js** 18+ ([Download](https://nodejs.org/))- Socket.IO```

- **PostgreSQL** 14+ (Railway, Supabase, Neon ou local)

- **Git** para controle de versão- JWT



---### 2️⃣ Configurar Banco de Dados



## 📦 Instalação## 📝 Scripts



### 1. Clone o repositório#### Opção A: Supabase (Recomendado)



```bash```bash

git clone https://github.com/tribodiamantino-cmyk/quadro-obras.git

cd quadro-obrasnpm start                    # Produção1. Criar conta em https://supabase.com

```

npm run dev                  # Desenvolvimento  2. Criar novo projeto

### 2. Instale as dependências

node scripts/add-user.js     # Adicionar usuário3. Copiar a **Connection String** em: `Settings > Database > Connection string > URI`

```bash

npm install```4. Substituir `[YOUR-PASSWORD]` pela senha do projeto

```



### 3. Configure as variáveis de ambiente

Veja documentação completa em `docs/````bash

```bash

cp .env.example .env# Exemplo de URL do Supabase

```DATABASE_URL="postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres"

```

Edite o arquivo `.env` com suas credenciais:

#### Opção B: PostgreSQL Local (Docker)

```env

# Banco de dados (Railway PostgreSQL)```bash

DATABASE_URL_RAILWAY="postgresql://usuario:senha@host:porta/database"# Subir PostgreSQL via Docker

docker run --name quadro-postgres -e POSTGRES_PASSWORD=senha123 -p 5432:5432 -d postgres:15

# JWT Secret (gere um aleatório)

JWT_SECRET="seu_secret_key_aqui"# Criar banco

docker exec -it quadro-postgres psql -U postgres -c "CREATE DATABASE quadro_obras;"

# Porta do servidor```

PORT=3000

### 3️⃣ Configurar Variáveis de Ambiente

# Ambiente

NODE_ENV=development```bash

```# Copiar arquivo de exemplo

cp .env.example .env

### 4. Execute o servidor

# Editar .env e adicionar sua DATABASE_URL

```bash```

# Desenvolvimento (com auto-reload)

npm run dev:railway**Exemplo de `.env`:**



# Produção```bash

npm run startPORT=3000

```NODE_ENV=development



### 5. Acesse o sistema# Sua URL do PostgreSQL

DATABASE_URL="postgresql://postgres:senha123@localhost:5432/quadro_obras?schema=public"

Abra o navegador em: **http://localhost:3000**

# Gere um secret seguro (use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

---JWT_SECRET=seu_secret_super_seguro_aqui_mude_isso



## 🗄️ Estrutura do Banco de DadosJWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000

### Tabelas Principais```



#### `organizations`### 4️⃣ Rodar Migrações do Prisma

Empresas/organizações (multi-tenant)

- `id`, `name`, `slug````bash

# Cria as tabelas no banco

#### `users`npm run db:push

Usuários do sistema

- `id`, `email`, `password`, `name`, `role`, `organization_id`# OU (para desenvolvimento com histórico de migrations)

- **Roles:** ADMIN, MEMBER, VIEWERnpm run db:migrate

```

#### `projects`

Obras/projetos### 5️⃣ Popular Banco com Dados

- `id`, `name`, `client_name`, `organization_id`

- `store_id`, `work_status_id`, `category`#### Opção A: Migrar dados do `db.json` antigo

- `integrator_id`, `assembler_id`, `electrician_id`

- `start_date`, `delivery_forecast`, `location_address````bash

- `observations`, `archived`, `display_order`node prisma/migrate-from-json.js

```

#### `tasks`

Tarefas do KanbanIsso vai:

- `id`, `title`, `status`, `project_id`, `organization_id`- Ler seu `db.json` atual

- `responsible`, `display_order`, `created_at`- Criar uma organização

- Criar um usuário admin (`admin@empresa.com` / `admin123`)

#### Tabelas Auxiliares- Migrar todos os projetos e tarefas

- `stores` - Lojas- Fazer backup do `db.json`

- `work_statuses` - Status de obra

- `integrators`, `assemblers`, `electricians` - Responsáveis#### Opção B: Criar dados de exemplo

- `audit_logs` - Histórico de ações

```bash

---npm run db:seed

```

## 🛠️ Scripts Disponíveis

Cria:

### Desenvolvimento- 2 organizações de exemplo

```bash- 3 usuários (ADMIN, MEMBER, VIEWER)

npm run dev:railway    # Servidor com auto-reload (Railway)- 2 projetos com tarefas

npm run dev            # Servidor com auto-reload (Supabase)

```### 6️⃣ Iniciar Servidor



### Produção```bash

```bash# Produção

npm run start          # Iniciar servidor (Railway)npm start

npm run prod:railway   # Produção com NODE_ENV=production

```# Desenvolvimento (com auto-reload)

npm run dev

### Banco de Dados```

```bash

npm run db:migrate     # Executar migrações PrismaAcesse: **http://localhost:3000**

npm run db:studio      # Abrir Prisma Studio (interface visual)

npm run db:seed        # Popular banco com dados de exemplo---

```

## 🔐 Autenticação

### Utilitários

```bash### Registrar Nova Organização

npm run backup         # Fazer backup do banco

npm run logs           # Visualizar logs de auditoria```bash

npm test               # Testar se Node.js está funcionandoPOST /api/auth/register

```Content-Type: application/json



---{

  "email": "admin@minhaempresa.com",

## 🏗️ Arquitetura  "password": "senha_segura_123",

  "name": "João Silva",

### Backend  "organizationName": "Minha Construtora Ltda"

- **Node.js** + **Express.js**}

- **PostgreSQL** (Railway)```

- **Socket.IO** para real-time

- **JWT** para autenticação**Resposta:**

- **bcryptjs** para senhas```json

{

### Frontend  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

- Vanilla JavaScript (ES6+)  "user": {

- HTML5 + CSS3    "id": "clx...",

- Socket.IO Client    "email": "admin@minhaempresa.com",

- Drag & Drop API nativa    "name": "João Silva",

    "role": "ADMIN",

### Estrutura de Pastas    "organizationId": "clx...",

    "organizationName": "Minha Construtora Ltda",

```    "organizationSlug": "minha-construtora-ltda"

quadro-obras/  }

├── server-railway.js          # Servidor principal (Railway)}

├── server-supabase.js         # Servidor alternativo (Supabase)```

├── package.json               # Dependências

├── prisma/### Fazer Login

│   └── schema.prisma          # Schema do banco

├── src/```bash

│   ├── controllers/           # Lógica de negócioPOST /api/auth/login

│   ├── routes/                # Rotas da APIContent-Type: application/json

│   ├── middleware/            # Autenticação e validação

│   └── utils/                 # Funções auxiliares{

├── public/                    # Frontend estático  "email": "admin@minhaempresa.com",

│   ├── index.html             # Dashboard principal  "password": "senha_segura_123"

│   ├── login.html             # Tela de login}

│   ├── register.html          # Tela de registro```

│   ├── settings.html          # Configurações

│   ├── app-simple.js          # Lógica do frontend### Usar Token nas Requests

│   ├── auth.js                # Autenticação frontend

│   └── style.css              # Estilos```bash

├── scripts/                   # Scripts de manutençãoGET /api/state

└── docs/                      # Documentação adicionalAuthorization: Bearer SEU_TOKEN_AQUI

``````



------



## 🔐 Autenticação## 👥 Roles e Permissões



### Registro de Novo Usuário| Role | Criar/Editar | Deletar | Convidar Usuários |

|------|--------------|---------|-------------------|

```javascript| **ADMIN** | ✅ | ✅ | ✅ |

POST /api/auth/register| **MEMBER** | ✅ | ✅ | ❌ |

{| **VIEWER** | ❌ | ❌ | ❌ |

  "email": "usuario@exemplo.com",

  "password": "senha123",---

  "name": "Nome do Usuário",

  "organizationName": "Nome da Empresa"## 📡 API Endpoints

}

```### Auth



### Login```

POST   /api/auth/register      - Criar nova organização + admin

```javascriptPOST   /api/auth/login         - Fazer login

POST /api/auth/loginGET    /api/auth/me            - Dados do usuário autenticado

{POST   /api/auth/invite        - Convidar usuário (ADMIN only)

  "email": "usuario@exemplo.com",```

  "password": "senha123"

}### Projects



// Retorna:```

{GET    /api/state              - Buscar todos os projetos e tarefas

  "token": "jwt_token",POST   /api/project            - Criar projeto

  "user": {PATCH  /api/project/:id        - Atualizar projeto

    "id": "...",DELETE /api/project/:id        - Deletar projeto (ADMIN only)

    "email": "...",```

    "name": "...",

    "role": "ADMIN"### Tasks

  }

}```

```POST   /api/task               - Criar tarefa

PATCH  /api/task/:id           - Atualizar tarefa

O token deve ser enviado em todas as requisições protegidas:DELETE /api/task/:id           - Deletar tarefa

```POST   /api/task/:id/duplicate-pending

Authorization: Bearer <token>POST   /api/task/:id/advance-with-pending

```POST   /api/tasks/batch-copy

POST   /api/tasks/batch-delete

---```



## 📡 API Endpoints---



### Projetos## 🗄️ Comandos Úteis do Prisma



``````bash

GET    /api/projects/state      # Estado completo (projetos + tarefas)# Ver banco no navegador

GET    /api/projects             # Lista de projetosnpm run db:studio

GET    /api/projects/:id         # Detalhes de um projeto

POST   /api/projects             # Criar projeto# Criar migration

PUT    /api/projects/:id         # Atualizar projetonpm run db:migrate

DELETE /api/projects/:id         # Excluir projeto

PUT    /api/projects/:id/archive # Arquivar/desarquivar# Aplicar schema sem migration

POST   /api/projects/reorder     # Reordenar projetosnpm run db:push

```

# Popular banco

### Tarefasnpm run db:seed



```# Resetar banco (CUIDADO!)

GET    /api/projects/:id/tasks   # Tarefas de um projetonpx prisma migrate reset

POST   /api/tasks                # Criar tarefa```

PUT    /api/tasks/:id            # Atualizar tarefa

DELETE /api/tasks/:id            # Excluir tarefa---

PUT    /api/tasks/:id/move       # Mover tarefa (Kanban)

POST   /api/tasks/reorder        # Reordenar tarefas## 🐳 Deploy com Docker

```

```dockerfile

### Dados Auxiliares# Dockerfile

FROM node:18-alpine

```WORKDIR /app

GET /api/stores                  # Lista de lojasCOPY package*.json ./

GET /api/work-statuses           # Status de obraRUN npm ci --only=production

GET /api/integrators             # IntegradoresCOPY . .

GET /api/assemblers              # MontadoresRUN npx prisma generate

GET /api/electricians            # EletricistasEXPOSE 3000

```CMD ["npm", "start"]

```

### Autenticação

```bash

```# Build

POST /api/auth/register          # Criar contadocker build -t quadro-obras .

POST /api/auth/login             # Login

GET  /api/auth/me                # Dados do usuário logado# Run

```docker run -p 3000:3000 \

  -e DATABASE_URL="postgresql://..." \

---  -e JWT_SECRET="..." \

  quadro-obras

## 🔌 Socket.IO Events```



### Emitidos pelo servidor---



```javascript## 🌍 Deploy em Produção

// Projetos

'project:created'   // Novo projeto criado### Vercel (Recomendado)

'project:updated'   // Projeto atualizado

'project:deleted'   // Projeto excluído1. Conectar repositório no Vercel

'project:archived'  // Projeto arquivado/desarquivado2. Adicionar variáveis de ambiente:

   - `DATABASE_URL`

// Tarefas   - `JWT_SECRET`

'task:created'      // Nova tarefa criada   - `NODE_ENV=production`

'task:updated'      // Tarefa atualizada3. Deploy automático! ✨

'task:deleted'      // Tarefa excluída

'task:moved'        // Tarefa movida (status alterado)### Railway

```

```bash

### Cliente ouve os eventos# Instalar CLI

npm i -g @railway/cli

```javascript

socket.on('task:created', (task) => {# Login e deploy

  // Adicionar tarefa na UIrailway login

});railway init

railway up

socket.on('task:moved', (data) => {```

  // Atualizar posição da tarefa

});### Render

```

1. Criar Web Service

---2. Conectar repo

3. Build: `npm install && npx prisma generate && npx prisma db push`

## 🎨 Temas4. Start: `npm start`



O sistema possui **tema escuro** (padrão) com cores customizáveis.---



**Paleta de cores:**## 🔧 Troubleshooting

- Background: `#0f172a` (dark blue)

- Cards: `#1e293b`### Erro: "Environment variable not found: DATABASE_URL"

- Texto: `#ecf0f1`

- Accent: `#3498db````bash

- Success: `#2ecc71`# Certifique-se que o .env existe e está correto

- Warning: `#f39c12`cat .env

- Danger: `#e74c3c`

# Regenerar Prisma Client

---npx prisma generate

```

## 🚀 Deploy

### Erro: "Can't reach database server"

### Railway (Recomendado)

```bash

1. Crie conta no [Railway](https://railway.app/)# Teste a conexão

2. Conecte seu repositório GitHubnpx prisma db pull

3. Adicione um PostgreSQL Database

4. Configure as variáveis de ambiente:# Verifique se PostgreSQL está rodando

   - `DATABASE_URL_RAILWAY` (gerado automaticamente)docker ps  # se usando Docker

   - `JWT_SECRET````

   - `PORT=3000`

5. Deploy automático a cada push!### Erro: "Invalid token" no frontend



### Outras Plataformas- Verifique se o token está sendo enviado no header `Authorization: Bearer TOKEN`

- Certifique-se que `JWT_SECRET` é o mesmo em todos os ambientes

- **Heroku:** Configure o Procfile e PostgreSQL addon- Token pode ter expirado (padrão: 7 dias)

- **Render:** Configure web service + PostgreSQL

- **Vercel:** Para frontend estático (mude backend para serverless)---



---## 📊 Estrutura do Projeto



## 🧪 Testes```

quadro-obras/

```bash├── prisma/

# Testar conexão do banco│   ├── schema.prisma           # Definição do banco

node debug-tasks.js│   ├── seed.js                 # Dados de exemplo

│   └── migrate-from-json.js    # Migração do db.json antigo

# Verificar dados├── src/

node scripts/check-data.js│   ├── controllers/

│   │   ├── auth.controller.js

# Backup do banco│   │   └── projects.controller.js

node scripts/backup-database.js│   ├── middleware/

```│   │   └── auth.js             # JWT middleware

│   └── routes/

---│       ├── auth.routes.js

│       └── projects.routes.js

## 📚 Documentação Adicional├── public/

│   ├── index.html

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitetura detalhada│   ├── app.js                  # Frontend

- **[API.md](docs/API.md)** - Referência completa da API│   └── style.css

- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Guia de deploy├── server-new.js               # Servidor principal

├── package.json

---└── .env                        # Variáveis de ambiente

```

## 🤝 Contribuindo

---

1. Fork o projeto

2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)## 🔄 Migração da Versão Antiga

3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)

4. Push para a branch (`git push origin feature/MinhaFeature`)Se você já tem dados no `db.json`:

5. Abra um Pull Request

```bash

---# 1. Fazer backup

cp db.json db.json.backup

## 📄 Licença

# 2. Rodar migração

Este projeto é proprietário. Todos os direitos reservados.node prisma/migrate-from-json.js



---# 3. Verificar dados

npm run db:studio

## 👥 Autor

# 4. Renomear server

Desenvolvido por **Tribo Diamantino CMYK**mv server.js server-old.js

mv server-new.js server.js

---

# 5. Reiniciar

## 📞 Suportenpm start

```

Para problemas ou dúvidas:

- Abra uma [Issue](https://github.com/tribodiamantino-cmyk/quadro-obras/issues)**Credenciais padrão após migração:**

- Email: suporte@exemplo.com- Email: `admin@empresa.com`

- Senha: `admin123`

---

⚠️ **IMPORTANTE:** Altere a senha após primeiro login!

**Versão:** 2.0  

**Última atualização:** Dezembro 2025---


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
