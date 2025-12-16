# 🔄 Migração para Railway PostgreSQL - GUIA COMPLETO

## ✅ Progresso até agora

- [x] Banco PostgreSQL criado no Railway
- [x] Schema executado (todas as tabelas criadas)
- [x] **45 obras + 138 tarefas importadas com sucesso!**
- [x] 9 lojas, 11 status, 7 integradores, 4 montadores, 4 eletricistas
- [ ] Criar novo serviço para testar
- [ ] Deploy e validação

---

## 🚀 Próximos Passos

### 1️⃣ Criar Novo Serviço no Railway (Teste)

1. Acesse o Railway Dashboard
2. No projeto, clique **"+ New"** → **"GitHub Repo"**
3. Selecione o repo `tribodiamantino-cmyk/quadro-obras`
4. Configure:
   - **Name**: `quadro-obras-postgresql` (ou outro nome)
   - **Start Command**: `node server-railway.js`
   - **Root Directory**: deixe vazio

### 2️⃣ Configurar Variáveis de Ambiente

No novo serviço, adicione:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=d9d0afae99a03a43e74ca70ba847ae7444154a343e00ebb9a5ae7511493ad5f0
NODE_ENV=production
PORT=4000
```

**Importante**: Use a referência `${{Postgres.DATABASE_URL}}` para linkar ao banco automaticamente.

### 3️⃣ Fazer Deploy

1. Salve as variáveis
2. O Railway vai fazer deploy automaticamente
3. Aguarde o build completar (~2-3 minutos)

### 4️⃣ Testar

Acesse a URL do novo serviço (vai aparecer no Railway) e teste:
- Login
- Criar/editar obra
- Dashboard
- Calendário

---

## 🔧 O que foi criado

- **`server-railway.js`**: Servidor adaptado para PostgreSQL direto
- **`src/config/database.js`**: Cliente PostgreSQL configurado
- **`migrations/`**: Scripts de exportação/importação

---

## 📊 Comparação

| Item | Supabase (Atual) | Railway PostgreSQL (Novo) |
|------|------------------|---------------------------|
| Biblioteca | `@supabase/supabase-js` | `pg` (node-postgres) |
| Queries | Query builder | SQL direto |
| Auth | Supabase Auth | JWT manual |
| Realtime | Supabase Realtime | Socket.IO |
| Custo | ~$25/mês | Incluído no Railway |

---

## ⚠️ Rollback

Se algo der errado, o serviço atual continua funcionando normalmente.
Basta manter o domínio principal apontando para o serviço antigo.

---

## ✅ Quando Tudo Estiver OK

1. Teste tudo no novo serviço
2. Aponte o domínio principal para o novo serviço
3. Monitore por alguns dias
4. Quando confirmar que está tudo OK, pode desligar o Supabase

---

**Status**: ✅ Dados migrados | 🔄 Aguardando criar novo serviço no Railway
