# 🚀 Migração Supabase → Railway PostgreSQL

## Passo a Passo Completo

---

## 1️⃣ Criar Banco PostgreSQL no Railway

1. Acesse [Railway](https://railway.app)
2. No seu projeto, clique em **"+ New"** → **"Database"** → **"PostgreSQL"**
3. Aguarde o banco ser provisionado
4. Clique no banco criado → **"Variables"**
5. Copie a variável `DATABASE_URL`

---

## 2️⃣ Adicionar Variável no Railway

No seu serviço backend (quadro-obras):
1. Clique no serviço → **"Variables"**
2. Adicione: `DATABASE_URL` = (cole o valor copiado)
3. A variável já existe automaticamente se você linkou o banco

---

## 3️⃣ Exportar Dados do Supabase (Local)

```bash
# Na pasta do projeto
node migrations/export-supabase.js
```

Isso criará um arquivo `migrations/backup/supabase-backup-XXXXX.json`

---

## 4️⃣ Criar Schema no Railway

### Opção A: Via Railway Dashboard
1. No banco PostgreSQL, clique em **"Data"**
2. Cole o conteúdo de `migrations/01-schema.sql`
3. Execute

### Opção B: Via psql (linha de comando)
```bash
# Usando a DATABASE_URL do Railway
psql "sua-database-url" -f migrations/01-schema.sql
```

### Opção C: Via DBeaver/pgAdmin
1. Conecte no banco usando a DATABASE_URL
2. Execute o arquivo `migrations/01-schema.sql`

---

## 5️⃣ Importar Dados

```bash
# Configure DATABASE_URL localmente (crie um .env.railway ou exporte)
set DATABASE_URL=sua-url-do-railway

# Execute a importação
node migrations/import-railway.js
```

---

## 6️⃣ Atualizar Variáveis no Railway

Certifique-se que estas variáveis estão configuradas no serviço:

```
DATABASE_URL=postgresql://...  (do banco Railway)
JWT_SECRET=seu-secret-atual
NODE_ENV=production
```

**Remova** (se existirem):
- SUPABASE_URL
- SUPABASE_ANON_KEY

---

## 7️⃣ Deploy

O servidor vai usar `DATABASE_URL` automaticamente.

```bash
git add .
git commit -m "feat: migração para Railway PostgreSQL v1.3.0"
git push
```

---

## 📁 Estrutura dos Arquivos de Migração

```
migrations/
├── 01-schema.sql           # Schema completo do banco
├── export-supabase.js      # Script para exportar dados
├── import-railway.js       # Script para importar dados
└── backup/                 # Pasta com backups JSON
    └── supabase-backup-XXX.json
```

---

## 🔧 Alterações no Código

O servidor `server-supabase.js` será substituído por `server-railway.js` que usa:
- Conexão: `pg` (node-postgres) em vez de `@supabase/supabase-js`
- Queries: SQL direto em vez de query builder do Supabase

---

## ⚠️ Checklist Antes de Migrar

- [ ] Backup do Supabase feito (`node migrations/export-supabase.js`)
- [ ] Banco PostgreSQL criado no Railway
- [ ] Schema executado no Railway (`01-schema.sql`)
- [ ] DATABASE_URL configurada no projeto Railway
- [ ] Dados importados (`node migrations/import-railway.js`)
- [ ] Testado localmente com DATABASE_URL do Railway
- [ ] Deploy feito

---

## 🆘 Rollback

Se algo der errado, o Supabase ainda estará funcionando.
Basta reverter o commit e as variáveis de ambiente.
