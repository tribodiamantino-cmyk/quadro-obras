# 🚀 PRÓXIMO PASSO: Criar Novo Serviço no Railway

## ✅ O que já foi feito

- ✅ Banco PostgreSQL criado no Railway
- ✅ **45 obras + 138 tarefas migradas com sucesso!**
- ✅ Servidor `server-railway.js` criado e testado localmente
- ✅ Código commitado no GitHub

---

## 📋 Agora você precisa fazer no Railway:

### 1️⃣ Criar Novo Serviço

1. Acesse: https://railway.app/dashboard
2. Entre no projeto `quadro-obras`
3. Clique **"+ New"**
4. Selecione **"GitHub Repo"**
5. Escolha o repositório `tribodiamantino-cmyk/quadro-obras`

### 2️⃣ Configurar o Serviço

Depois que o serviço for criado:

#### A) Settings (Configurações)
- **Service Name**: `quadro-obras-postgresql` (ou qualquer nome)
- **Start Command**: `node server-railway.js`
- **Root Directory**: (deixe vazio)

#### B) Variables (Variáveis de Ambiente)

Adicione essas variáveis:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=d9d0afae99a03a43e74ca70ba847ae7444154a343e00ebb9a5ae7511493ad5f0
NODE_ENV=production
PORT=4000
```

**Importante**: O `${{Postgres.DATABASE_URL}}` é uma referência ao banco. O Railway vai substituir automaticamente pela URL correta.

### 3️⃣ Deploy

1. Salve as configurações
2. O Railway vai fazer o build e deploy automaticamente
3. Aguarde ~2-3 minutos
4. Quando aparecer "Deploy successful", copie a URL do serviço

### 4️⃣ Testar

Acesse a URL do novo serviço e teste:

- `/login.html` - Login
- `/index.html` - Quadro de obras
- `/dashboard.html` - Dashboard público
- `/calendar.html` - Calendário
- `/health` - Health check

**Login de teste:**
- Email: `admin@construtora.com`
- Senha: A que você usa no sistema atual

---

## 🔄 Comparação dos Serviços

| Item | Serviço Atual (Supabase) | Novo Serviço (PostgreSQL) |
|------|--------------------------|----------------------------|
| Servidor | `server-supabase.js` | `server-railway.js` |
| Banco | Supabase | Railway PostgreSQL |
| URL | (atual) | (nova URL de teste) |
| Status | ✅ Funcionando | 🔄 Aguardando deploy |

---

## ⚠️ Importante

- O serviço atual **continua funcionando** normalmente
- Os dois serviços funcionarão em paralelo
- Teste TUDO no novo serviço antes de trocar o domínio
- Só desligue o Supabase depois que confirmar que está tudo OK

---

## ✅ Quando tudo estiver validado

1. No Railway, vá no novo serviço → **Settings** → **Networking**
2. Configure o domínio personalizado (se tiver)
3. OU: Aponte seu domínio para a nova URL
4. Monitore por alguns dias
5. Quando tudo estiver OK, desabilite o serviço antigo

---

## 🆘 Se algo der errado

Basta usar o serviço antigo novamente. Nada foi alterado no código atual do Supabase.

---

**Status Atual:**
- 🟢 Código pronto e no GitHub
- 🟢 Banco com todos os dados
- 🟡 Aguardando você criar o novo serviço no Railway

**Me avise quando criar o serviço e me passa a URL para eu testar junto com você!** 🚀
