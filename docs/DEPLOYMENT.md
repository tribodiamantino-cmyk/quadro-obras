# 🚀 Guia de Deploy - Quadro de Obras

Instruções completas para fazer deploy do sistema em produção.

---

## 📋 Pré-requisitos

- Conta no [Railway](https://railway.app/) (recomendado) ou outra plataforma
- Conta no [GitHub](https://github.com/) (para deploy automático)
- Banco PostgreSQL (Railway fornece gratuitamente)

---

## 🚂 Deploy no Railway (Recomendado)

### 1. Preparar o Repositório

```bash
# Se ainda não tem o código no GitHub:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/quadro-obras.git
git push -u origin main
```

### 2. Criar Projeto no Railway

1. Acesse [railway.app](https://railway.app/)
2. Clique em **"Start a New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha seu repositório `quadro-obras`
5. O Railway vai detectar automaticamente que é Node.js

### 3. Adicionar PostgreSQL

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Aguarde a criação do banco
4. Railway vai gerar automaticamente:
   - `DATABASE_URL`
   - Credenciais de acesso

### 4. Configurar Variáveis de Ambiente

No painel do Railway, vá em **Variables** e adicione:

```env
DATABASE_URL_RAILWAY=${{Postgres.DATABASE_URL}}
JWT_SECRET=seu_secret_aleatorio_aqui_123456
PORT=3000
NODE_ENV=production
```

**Importante:**
- `DATABASE_URL_RAILWAY` usa a referência do banco Railway
- `JWT_SECRET` deve ser uma string aleatória longa (use um gerador)

### 5. Deploy Automático

O Railway faz deploy automaticamente:
1. Detecta `package.json`
2. Roda `npm install`
3. Executa `npm start` (que roda `server-railway.js`)
4. Gera uma URL pública: `https://seu-projeto.up.railway.app`

### 6. Criar Tabelas do Banco

Após o primeiro deploy, execute as migrations:

**Opção A - Pela interface Railway:**
1. Vá em PostgreSQL → **Data** → **Query**
2. Cole e execute cada arquivo SQL em ordem:
   - Schema básico (crie as tabelas manualmente ou use Prisma)

**Opção B - Via Prisma (recomendado):**
```bash
# Local, com DATABASE_URL_RAILWAY configurado
npx prisma db push
```

### 7. Criar Usuário Inicial

Execute o script de seed no Railway Terminal:

```bash
npm run db:seed
```

Ou crie manualmente via SQL:

```sql
INSERT INTO organizations (id, name, slug) 
VALUES (gen_random_uuid(), 'Minha Empresa', 'minha-empresa');

-- Substitua ORG_ID pelo ID gerado acima
INSERT INTO users (id, email, password, name, role, organization_id)
VALUES (
  gen_random_uuid(),
  'admin@admin.com',
  '$2a$10$...',  -- Hash bcrypt de 'admin123'
  'Administrador',
  'ADMIN',
  'ORG_ID'
);
```

### 8. Testar Deploy

1. Acesse a URL gerada: `https://seu-projeto.up.railway.app`
2. Faça login com as credenciais criadas
3. Teste criação de projetos e tarefas

---

## ⚙️ Configurações Avançadas

### Custom Domain

1. No Railway, vá em **Settings** → **Domains**
2. Clique em **"Generate Domain"** ou **"Add Custom Domain"**
3. Configure o DNS:
   ```
   Type: CNAME
   Name: @
   Value: seu-projeto.up.railway.app
   ```

### Logs e Monitoramento

**Ver logs em tempo real:**
```bash
railway logs
```

**No painel Railway:**
- Clique no seu serviço
- Vá em **"Deployments"** → selecione o deploy → **"View Logs"**

### Redeploy Manual

Se precisar forçar um novo deploy:

1. No GitHub, faça qualquer commit:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

2. Ou no Railway:
   - Vá em **Deployments** → **"Redeploy"**

### Rollback

Se algo der errado:

1. No Railway, vá em **Deployments**
2. Selecione um deploy anterior
3. Clique em **"Redeploy"**

---

## 🐳 Deploy com Docker (Alternativa)

### Dockerfile

Crie na raiz do projeto:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL_RAILWAY=postgresql://user:pass@db:5432/obras
      - JWT_SECRET=seu_secret
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=obras
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Comandos

```bash
# Build e start
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

## ☁️ Deploy em Outras Plataformas

### Heroku

```bash
# Instalar Heroku CLI
heroku login
heroku create quadro-obras

# Adicionar PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Configurar variáveis
heroku config:set JWT_SECRET=seu_secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

### Render

1. Criar conta no [Render](https://render.com/)
2. **New** → **Web Service**
3. Conectar repositório GitHub
4. Configurar:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Adicionar PostgreSQL: **New** → **PostgreSQL**
6. Adicionar variáveis de ambiente

### Vercel (Frontend Static)

⚠️ **Atenção:** Vercel é ideal para frontend estático, mas backend Node.js precisa ser convertido para Serverless Functions.

```bash
npm install -g vercel
vercel login
vercel
```

---

## 🔧 Troubleshooting

### Erro: "Cannot find module"

**Causa:** Dependências não instaladas

**Solução:**
```bash
npm install
```

### Erro: "Database connection failed"

**Causa:** `DATABASE_URL_RAILWAY` incorreto

**Solução:**
1. Verifique se a variável está configurada
2. Teste a conexão:
   ```bash
   node -e "const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL_RAILWAY});p.query('SELECT 1').then(()=>console.log('✅ OK')).catch(e=>console.error('❌',e))"
   ```

### Erro: "Port already in use"

**Causa:** Porta 3000 ocupada

**Solução:**
```bash
# Matar processo na porta 3000
npx kill-port 3000

# Ou usar outra porta
PORT=3001 npm start
```

### Deploy não atualiza

**Causa:** Cache do Railway

**Solução:**
1. Faça um commit vazio: `git commit --allow-empty -m "Clear cache" && git push`
2. Ou limpe o cache no Railway: Settings → **Clear Build Cache**

### Socket.IO não conecta

**Causa:** URL incorreta ou CORS

**Solução:**
```javascript
// Ajustar em public/app-simple.js
const socket = io('https://seu-dominio.up.railway.app', {
  transports: ['websocket', 'polling']
});
```

---

## 📊 Monitoramento em Produção

### Logs Importantes

```bash
# Ver logs recentes
railway logs --tail 100

# Filtrar por erro
railway logs | grep ERROR

# Salvar logs
railway logs > logs.txt
```

### Métricas no Railway

- **CPU Usage:** Uso do processador
- **Memory:** Uso de RAM
- **Network:** Tráfego de rede
- **Disk:** Espaço em disco

### Health Check

Crie um endpoint de status:

```javascript
// Em server-railway.js
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

---

## 🔐 Backup do Banco

### Backup Manual (Railway)

```bash
# Conectar ao banco
railway connect Postgres

# Dentro do psql:
\dt                           # Listar tabelas
\copy projects TO 'projects.csv' CSV HEADER;
\copy tasks TO 'tasks.csv' CSV HEADER;
```

### Backup Automatizado

Use o script do projeto:

```bash
npm run backup
```

Salva em `backups/backup-YYYY-MM-DD.json`

### Restaurar Backup

```bash
# TODO: Criar script de restore
node scripts/restore-backup.js backups/backup-2025-12-22.json
```

---

## 🚀 CI/CD Avançado

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `railway logs`
2. Teste localmente primeiro: `npm run dev:railway`
3. Consulte a documentação: [Railway Docs](https://docs.railway.app/)

---

**Última atualização:** Dezembro 2025
