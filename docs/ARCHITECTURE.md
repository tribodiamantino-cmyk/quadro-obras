# 🏛️ Arquitetura do Sistema - Quadro de Obras

Documentação técnica detalhada da arquitetura, banco de dados, APIs e fluxos do sistema.

---

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Client)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   HTML/CSS   │  │ JavaScript   │  │  Socket.IO   │          │
│  │    Vanilla   │  │    ES6+      │  │    Client    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────┴────────────────────────────────────────┐
│                      BACKEND (Server)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Express.js  │  │  Socket.IO   │  │ Middleware   │          │
│  │   REST API   │  │   Real-time  │  │  JWT Auth    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Controllers & Routes                     │       │
│  │  • Auth   • Projects   • Tasks   • Settings          │       │
│  └──────────────────────────────────────────────────────┘       │
└────────────────────────┬────────────────────────────────────────┘
                         │ PostgreSQL Protocol
┌────────────────────────┴────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │Organizations│  │    Users    │  │   Projects  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │    Tasks    │  │   Stores    │  │ Audit Logs  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Modelo de Dados (Database Schema)

### Diagrama ER

```
┌──────────────────────┐
│   Organizations      │
│  ┌───────────────┐   │
│  │ id (PK)       │   │
│  │ name          │   │
│  │ slug          │   │
│  └───────────────┘   │
└──────┬───────────────┘
       │ 1:N
       ├─────────────────────────────────────────────┐
       │                                             │
       ▼                                             ▼
┌──────────────────────┐                    ┌──────────────────────┐
│      Users           │                    │      Projects        │
│  ┌───────────────┐   │                    │  ┌───────────────┐   │
│  │ id (PK)       │   │                    │  │ id (PK)       │   │
│  │ email         │   │                    │  │ name          │   │
│  │ password      │   │                    │  │ client_name   │   │
│  │ name          │   │                    │  │ organization_id (FK) │
│  │ role          │   │                    │  │ store_id (FK) │   │
│  │ organization_id (FK) │                 │  │ work_status_id│   │
│  └───────────────┘   │                    │  │ integrator_id │   │
└──────────────────────┘                    │  │ assembler_id  │   │
                                            │  │ electrician_id│   │
                                            │  │ start_date    │   │
                                            │  │ delivery_forecast│
                                            │  │ observations  │   │
                                            │  │ archived      │   │
                                            │  │ display_order │   │
                                            │  └───────────────┘   │
                                            └──────┬───────────────┘
                                                   │ 1:N
                                                   ▼
                                            ┌──────────────────────┐
                                            │       Tasks          │
                                            │  ┌───────────────┐   │
                                            │  │ id (PK)       │   │
                                            │  │ title         │   │
                                            │  │ status        │   │
                                            │  │ project_id (FK)   │
                                            │  │ organization_id (FK)│
                                            │  │ responsible   │   │
                                            │  │ display_order │   │
                                            │  │ created_at    │   │
                                            │  └───────────────┘   │
                                            └──────────────────────┘
```

### Tabelas Detalhadas

#### `organizations`
Tabela de organizações (empresas/clientes) - Multi-tenant

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `name` | VARCHAR(255) | Nome da organização |
| `slug` | VARCHAR(255) | Identificador URL-friendly (único) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data da última atualização |

**Índices:**
- `PRIMARY KEY (id)`
- `UNIQUE (slug)`

---

#### `users`
Usuários do sistema com controle de acesso por organização

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `email` | VARCHAR(255) | Email (único globalmente) |
| `password` | VARCHAR(255) | Hash bcrypt da senha |
| `name` | VARCHAR(255) | Nome completo |
| `role` | ENUM | ADMIN, MEMBER ou VIEWER |
| `organization_id` | UUID (FK) | Organização do usuário |
| `active` | BOOLEAN | Usuário ativo? (padrão: true) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data da última atualização |

**Roles:**
- `ADMIN`: Acesso total (criar usuários, projetos, configurações)
- `MEMBER`: Criar/editar projetos e tarefas
- `VIEWER`: Apenas visualizar

**Índices:**
- `PRIMARY KEY (id)`
- `UNIQUE (email)`
- `INDEX (organization_id)`

**Constraints:**
- `FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE`

---

#### `projects`
Obras/projetos de construção

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `name` | VARCHAR(255) | Nome do projeto |
| `client_name` | VARCHAR(255) | Nome do cliente |
| `organization_id` | UUID (FK) | Organização proprietária |
| `store_id` | UUID (FK) | Loja responsável |
| `work_status_id` | UUID (FK) | Status da obra |
| `category` | VARCHAR(50) | "Loja" ou "GSI" |
| `integrator_id` | UUID (FK) | Integrador responsável |
| `assembler_id` | UUID (FK) | Montador responsável |
| `electrician_id` | UUID (FK) | Eletricista responsável |
| `start_date` | DATE | Data de início |
| `delivery_forecast` | DATE | Previsão de entrega |
| `location_address` | TEXT | Endereço da obra |
| `location_lat` | FLOAT | Latitude (GPS) |
| `location_lng` | FLOAT | Longitude (GPS) |
| `observations` | TEXT | Observações gerais |
| `archived` | BOOLEAN | Arquivado? (padrão: false) |
| `display_order` | INTEGER | Ordem de exibição |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data da última atualização |

**Índices:**
- `PRIMARY KEY (id)`
- `INDEX (organization_id)`
- `INDEX (store_id)`
- `INDEX (work_status_id)`
- `INDEX (archived, display_order)`

**Constraints:**
- `FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE`
- `FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL`
- `FOREIGN KEY (work_status_id) REFERENCES work_statuses(id) ON DELETE SET NULL`

---

#### `tasks`
Tarefas do sistema Kanban

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `title` | VARCHAR(500) | Título da tarefa |
| `status` | VARCHAR(50) | Status atual (Kanban) |
| `project_id` | UUID (FK) | Projeto da tarefa |
| `organization_id` | UUID (FK) | Organização (para filtro rápido) |
| `responsible` | VARCHAR(255) | Responsável pela tarefa |
| `display_order` | INTEGER | Ordem dentro da coluna |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data da última atualização |

**Status válidos:**
- `Criado`: Tarefa criada
- `Em separação`: Material sendo separado
- `Pendencia`: Aguardando algo
- `Em romaneio`: Em transporte
- `Entregue`: Concluído

**Índices:**
- `PRIMARY KEY (id)`
- `INDEX (project_id, status, display_order)`
- `INDEX (organization_id)`

**Constraints:**
- `FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE`
- `FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE`

---

#### `stores`
Lojas/filiais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `name` | VARCHAR(255) | Nome da loja |
| `code` | VARCHAR(50) | Código identificador |
| `organization_id` | UUID (FK) | Organização proprietária |
| `active` | BOOLEAN | Loja ativa? |

---

#### `work_statuses`
Status de obra (ex: Aguardando, Em andamento, Concluído)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `name` | VARCHAR(100) | Nome do status |
| `color` | VARCHAR(7) | Cor hex (#RRGGBB) |
| `organization_id` | UUID (FK) | Organização proprietária |
| `display_order` | INTEGER | Ordem de exibição |

---

#### `integrators`, `assemblers`, `electricians`
Responsáveis por cada área (tabelas idênticas)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `name` | VARCHAR(255) | Nome completo |
| `organization_id` | UUID (FK) | Organização proprietária |

---

#### `audit_logs`
Logs de auditoria de todas as ações

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `user_id` | UUID (FK) | Usuário que executou |
| `organization_id` | UUID (FK) | Organização |
| `action` | VARCHAR(50) | Tipo de ação |
| `entity_type` | VARCHAR(50) | Tipo de entidade (project, task, etc) |
| `entity_id` | UUID | ID da entidade |
| `details` | JSONB | Detalhes adicionais |
| `ip_address` | VARCHAR(45) | IP do usuário |
| `created_at` | TIMESTAMP | Data/hora da ação |

**Ações registradas:**
- `CREATE`, `UPDATE`, `DELETE`, `ARCHIVE`, `LOGIN`, `LOGOUT`

---

## 🔐 Sistema de Autenticação

### Fluxo de Registro

```
┌──────────┐      POST /api/auth/register       ┌──────────┐
│  Client  │ ───────────────────────────────────▶│  Server  │
│          │  { email, password, name, orgName } │          │
└──────────┘                                     └────┬─────┘
                                                      │
                                                      ▼
                                              ┌───────────────┐
                                              │ 1. Validar    │
                                              │    dados      │
                                              └───────┬───────┘
                                                      │
                                                      ▼
                                              ┌───────────────┐
                                              │ 2. Hash senha │
                                              │    (bcrypt)   │
                                              └───────┬───────┘
                                                      │
                                                      ▼
                                              ┌───────────────┐
                                              │ 3. Criar org  │
                                              │    (se nova)  │
                                              └───────┬───────┘
                                                      │
                                                      ▼
                                              ┌───────────────┐
                                              │ 4. Criar user │
                                              │    no banco   │
                                              └───────┬───────┘
                                                      │
                                                      ▼
                                              ┌───────────────┐
                                              │ 5. Gerar JWT  │
                                              │    token      │
                                              └───────┬───────┘
                                                      │
┌──────────┐         { token, user }                 │
│  Client  │ ◀───────────────────────────────────────┘
│          │    Armazenar em localStorage
└──────────┘
```

### Fluxo de Login

```
┌──────────┐      POST /api/auth/login        ┌──────────┐
│  Client  │ ──────────────────────────────────▶│  Server  │
│          │      { email, password }          │          │
└──────────┘                                   └────┬─────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │ 1. Buscar     │
                                            │    user       │
                                            └───────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │ 2. Comparar   │
                                            │    senha hash │
                                            └───────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │ 3. Gerar JWT  │
                                            │    token      │
                                            └───────┬───────┘
                                                    │
┌──────────┐         { token, user }               │
│  Client  │ ◀─────────────────────────────────────┘
└──────────┘
```

### JWT Token Payload

```json
{
  "id": "user-uuid",
  "email": "usuario@exemplo.com",
  "organizationId": "org-uuid",
  "role": "ADMIN",
  "iat": 1703001234,
  "exp": 1703087634
}
```

**Expiração:** 7 dias

### Middleware de Autenticação

```javascript
// Verifica em cada request:
1. Token presente no header Authorization: Bearer <token>
2. Token válido (assinatura JWT)
3. Token não expirado
4. Usuário existe no banco
5. Adiciona req.user com dados do usuário
```

---

## 🔌 API REST

### Convenções

**Base URL:** `https://controle-obras.up.railway.app/api`

**Headers obrigatórios:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Respostas padrão:**

Sucesso (200-299):
```json
{
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

Erro (400-599):
```json
{
  "error": "Mensagem do erro",
  "details": "Detalhes adicionais (opcional)"
}
```

---

### Endpoints - Autenticação

#### `POST /api/auth/register`
Criar nova conta e organização

**Body:**
```json
{
  "email": "email@exemplo.com",
  "password": "senha123",
  "name": "Nome Completo",
  "organizationName": "Nome da Empresa"
}
```

**Response (201):**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "email@exemplo.com",
    "name": "Nome Completo",
    "role": "ADMIN",
    "organizationId": "org-uuid"
  }
}
```

---

#### `POST /api/auth/login`
Login no sistema

**Body:**
```json
{
  "email": "email@exemplo.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "token": "jwt_token",
  "user": { ... }
}
```

---

#### `GET /api/auth/me`
Dados do usuário logado

**Response (200):**
```json
{
  "id": "uuid",
  "email": "email@exemplo.com",
  "name": "Nome",
  "role": "ADMIN",
  "organizationId": "org-uuid",
  "organization": {
    "name": "Empresa"
  }
}
```

---

### Endpoints - Projetos

#### `GET /api/projects/state`
Retorna estado completo (projetos + tarefas + dados auxiliares)

**Response (200):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Projeto 1",
      "tasks": [ ... ],
      ...
    }
  ],
  "stores": [ ... ],
  "workStatuses": [ ... ],
  "integrators": [ ... ],
  "assemblers": [ ... ],
  "electricians": [ ... ]
}
```

---

#### `POST /api/projects`
Criar novo projeto

**Body:**
```json
{
  "name": "Nome do Projeto",
  "client_name": "Cliente",
  "store_id": "uuid",
  "category": "Loja"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Nome do Projeto",
  ...
}
```

---

#### `PUT /api/projects/:id`
Atualizar projeto

**Body:** (campos opcionais)
```json
{
  "name": "Novo nome",
  "observations": "Observações atualizadas"
}
```

---

#### `DELETE /api/projects/:id`
Excluir projeto

**Response (200):**
```json
{
  "message": "Projeto excluído com sucesso"
}
```

---

### Endpoints - Tarefas

#### `POST /api/tasks`
Criar nova tarefa

**Body:**
```json
{
  "title": "Comprar material",
  "project_id": "uuid",
  "status": "Criado"
}
```

---

#### `PUT /api/tasks/:id/move`
Mover tarefa (mudar status Kanban)

**Body:**
```json
{
  "status": "Em separação"
}
```

---

#### `DELETE /api/tasks/:id`
Excluir tarefa

---

## 🔄 Socket.IO Real-time

### Conexão

```javascript
const socket = io('https://controle-obras.up.railway.app', {
  auth: {
    token: localStorage.getItem('token')
  }
});
```

### Eventos Emitidos (Server → Client)

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `project:created` | `{ project }` | Novo projeto criado |
| `project:updated` | `{ project }` | Projeto atualizado |
| `project:deleted` | `{ projectId }` | Projeto excluído |
| `task:created` | `{ task }` | Nova tarefa criada |
| `task:updated` | `{ task }` | Tarefa atualizada |
| `task:deleted` | `{ taskId }` | Tarefa excluída |
| `task:moved` | `{ task, oldStatus, newStatus }` | Tarefa mudou de status |

### Exemplo de Uso

```javascript
// Ouvir criação de tarefas
socket.on('task:created', (task) => {
  if (task.project_id === currentProjectId) {
    addTaskToColumn(task);
  }
});

// Ouvir movimentação de tarefas
socket.on('task:moved', ({ task, oldStatus, newStatus }) => {
  removeTaskFromColumn(oldStatus, task.id);
  addTaskToColumn(task, newStatus);
});
```

---

## 🎯 Fluxos Principais

### Fluxo: Criar e Mover Tarefa

```
[Cliente cria tarefa]
       │
       ▼
POST /api/tasks ─────────▶ [Servidor]
                               │
                               ├─ Valida dados
                               ├─ Insere no banco
                               ├─ Cria log de auditoria
                               ├─ Emite socket: task:created
                               │
                               ▼
                           [Todos os clientes conectados recebem]
                               │
                               ▼
                     socket.on('task:created')
                               │
                               ▼
                    [Adiciona tarefa na coluna "Criado"]


[Cliente move tarefa via drag-drop]
       │
       ▼
PUT /api/tasks/:id/move ──▶ [Servidor]
  { status: "Em separação" }    │
                               ├─ Valida mudança de status
                               ├─ Atualiza banco
                               ├─ Cria log de auditoria
                               ├─ Emite socket: task:moved
                               │
                               ▼
                     [Todos os clientes recebem]
                               │
                               ▼
                   socket.on('task:moved')
                               │
                               ▼
           [Move tarefa da coluna "Criado" para "Em separação"]
```

---

## 🚀 Performance & Otimizações

### Cache Inteligente (Frontend)

```javascript
// Cache de 5 minutos para evitar requests desnecessários
const CACHE_TTL = 5 * 60 * 1000;
let cacheLoaded = false;
let lastFullLoad = 0;

// Invalidação automática após operações
function clearCache() {
  cacheLoaded = false;
  lastFullLoad = 0;
}

// Chamado após: criar/mover/excluir tarefas
```

### Filtros Locais (Instantâneos)

Todos os filtros (loja, status, categoria, busca) são aplicados **localmente** sem chamar o servidor:

```javascript
function applyLocalFilters() {
  let filtered = [...state.allProjects];
  
  if (!showArchived) filtered = filtered.filter(p => !p.archived);
  if (selectedStoreId) filtered = filtered.filter(p => p.store_id === selectedStoreId);
  if (selectedStatusId) filtered = filtered.filter(p => p.work_status_id === selectedStatusId);
  if (searchQuery) filtered = filtered.filter(p => p.name.includes(searchQuery));
  
  state.projects = filtered;
  renderProjectsList(); // Instantâneo!
}
```

### Índices de Banco

Índices estratégicos para queries rápidas:
- `(organization_id)` em todas as tabelas principais
- `(project_id, status, display_order)` em tasks
- `(archived, display_order)` em projects

---

## 🔒 Segurança

### Isolamento Multi-tenant

Todas as queries incluem `organization_id`:

```sql
SELECT * FROM projects 
WHERE organization_id = $1  -- Sempre filtra por org!
```

### Prevenção de SQL Injection

Uso de **prepared statements** em todas as queries:

```javascript
await db.many(
  'SELECT * FROM projects WHERE organization_id = $1',
  [organizationId]  // Valores parametrizados
);
```

### Hash de Senhas

```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash(password, 10);
```

### JWT Seguro

```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id, email, organizationId, role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

---

## 📊 Logs & Monitoramento

### Auditoria Automática

Toda ação importante é registrada em `audit_logs`:

```javascript
await db.single(
  `INSERT INTO audit_logs 
   (user_id, organization_id, action, entity_type, entity_id, details)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [userId, orgId, 'CREATE', 'project', projectId, JSON.stringify(details)]
);
```

### Logs do Servidor

```javascript
console.log('[AUTH] Login bem-sucedido:', user.email);
console.error('[ERROR] Falha ao criar projeto:', error.message);
```

---

**Última atualização:** Dezembro 2025
