# 🚀 GUIA DE DEPLOY NO RAILWAY

## 📋 PRÉ-REQUISITOS

✅ Dados importados e validados localmente
✅ Sistema funcionando em http://localhost:4000
✅ Conta GitHub (gratuita)
✅ Conta Railway (gratuita - até $5/mês)

---

## 🎯 PASSO A PASSO COMPLETO

### **ETAPA 1: Preparar Git e GitHub** 📦

#### 1.1 Inicializar Git

```powershell
# Executar script de setup do Git
.\setup-git.ps1
```

**O que faz:**
- ✅ Inicializa repositório Git
- ✅ Cria .gitignore (já está pronto)
- ✅ Cria branches: main, staging, development
- ✅ Faz commit inicial

#### 1.2 Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `quadro-obras-sistema`
3. Descrição: "Sistema de Gestão de Obras"
4. **Privado** ou Público (sua escolha)
5. **NÃO** marque "Initialize with README"
6. Clique em **"Create repository"**

#### 1.3 Conectar e Enviar Código

```powershell
# Adicionar remote do GitHub (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/quadro-obras-sistema.git

# Enviar código
git push -u origin main

# Enviar outras branches
git push origin staging
git push origin development
```

---

### **ETAPA 2: Deploy no Railway** 🚂

#### 2.1 Criar Conta no Railway

1. Acesse: https://railway.app
2. Clique em **"Start a New Project"** ou **"Login"**
3. Faça login com **GitHub** (recomendado)
4. Autorize o Railway a acessar seus repositórios

#### 2.2 Criar Novo Projeto

1. Clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório: `quadro-obras-sistema`
4. Branch: **main**
5. Clique em **"Deploy Now"**

#### 2.3 Configurar Variáveis de Ambiente

No painel do Railway:

1. Clique na aba **"Variables"**
2. Adicione as seguintes variáveis:

```env
# Porta (Railway define automaticamente, mas pode adicionar)
PORT=4000

# Supabase (COPIE do seu .env local)
SUPABASE_URL=https://ucwmumerebazffsgfusp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT (COPIE do seu .env local)
JWT_SECRET=d9d0afae99a03a43e74ca70ba847ae7444154a343e00ebb9a5ae7511493ad5f0
JWT_EXPIRES_IN=7d

# Ambiente
NODE_ENV=production

# CORS (depois você pega a URL do Railway e atualiza)
CORS_ORIGIN=*
```

**⚠️ IMPORTANTE:** 
- Copie `SUPABASE_URL` e `SUPABASE_ANON_KEY` do seu `.env` local
- Copie `JWT_SECRET` do seu `.env` local
- Use `CORS_ORIGIN=*` por enquanto (vamos ajustar depois)

3. Clique em **"Save"**

#### 2.4 Deploy Automático

O Railway vai automaticamente:
1. ✅ Detectar que é um projeto Node.js
2. ✅ Executar `npm install`
3. ✅ Executar `npm start`
4. ✅ Gerar uma URL pública

---

### **ETAPA 3: Obter URL e Configurar CORS** 🌐

#### 3.1 Pegar URL do Railway

1. No painel do Railway, vá em **"Settings"**
2. Em **"Domains"**, clique em **"Generate Domain"**
3. Railway vai gerar algo como: `https://quadro-obras-sistema-production.up.railway.app`
4. **Copie essa URL!**

#### 3.2 Atualizar CORS_ORIGIN

1. Volte em **"Variables"**
2. Edite `CORS_ORIGIN`
3. Mude de `*` para sua URL do Railway:
   ```
   CORS_ORIGIN=https://quadro-obras-sistema-production.up.railway.app
   ```
4. Salve

#### 3.3 Restart (se necessário)

Se o deploy não reiniciar automaticamente:
1. Clique nos 3 pontinhos no canto superior direito
2. **"Restart"**

---

### **ETAPA 4: Validar Deploy** ✅

#### 4.1 Acessar Sistema

Abra a URL do Railway no navegador:
```
https://sua-url.up.railway.app
```

**O que você deve ver:**
- ✅ Página de login
- ✅ Sem erros de CORS
- ✅ Conexão com Supabase funcionando

#### 4.2 Fazer Login

1. Use suas credenciais: `teste@teste.com`
2. Você deve ver os 42 projetos importados!
3. Todas as tarefas devem estar lá!

#### 4.3 Testar Funcionalidades

- ✅ Criar novo projeto
- ✅ Criar nova tarefa
- ✅ Mudar status de tarefa
- ✅ Filtros funcionando
- ✅ Real-time (WebSocket) funcionando

---

## 🎊 PRONTO! SISTEMA NO AR!

Seu sistema está **100% online** e acessível de qualquer lugar!

---

## 📊 PRÓXIMOS PASSOS (Opcional)

### Configurar Domínio Próprio

No Railway:
1. Vá em **Settings** → **Domains**
2. Clique em **"Custom Domain"**
3. Adicione seu domínio (exemplo: `obras.suaempresa.com`)
4. Configure DNS conforme instruções

### Monitoramento

O Railway oferece:
- 📊 Logs em tempo real
- 📈 Métricas de uso
- 🔔 Alertas de erro
- 💰 Uso de recursos

### Backups

Configure backups automáticos do Supabase:
1. Acesse Supabase Dashboard
2. Project Settings → Backups
3. Configure frequência

---

## ⚠️ TROUBLESHOOTING

### Erro de Build

```powershell
# Verificar logs no Railway
# Clique em "Deployments" → último deploy → "View Logs"
```

**Soluções comuns:**
- Verifique se `package.json` tem `"start": "node server-supabase.js"`
- Verifique se todas as dependências estão em `dependencies` (não em `devDependencies`)

### Erro de Conexão com Supabase

**Verifique:**
- ✅ `SUPABASE_URL` está correta
- ✅ `SUPABASE_ANON_KEY` está correta
- ✅ Variáveis sem espaços extras

### Erro de CORS

**Ajuste:**
```env
CORS_ORIGIN=https://sua-url-railway.up.railway.app
```

Sem barra `/` no final!

### WebSocket não funciona

**Possível causa:** Railway pode precisar de configuração adicional

**Solução:**
```javascript
// Em server-supabase.js, verificar se está usando:
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});
```

---

## 💰 CUSTOS

### Railway - Plano Gratuito
- ✅ $5 de crédito/mês (grátis)
- ✅ Suficiente para testes e pequeno uso
- ✅ Deploy ilimitados
- ✅ 1 projeto ativo

### Railway - Plano Pago
- 💳 A partir de $5/mês
- ✅ Mais recursos
- ✅ Melhor performance
- ✅ Suporte prioritário

### Supabase - Plano Gratuito
- ✅ 500MB banco de dados
- ✅ 1GB file storage
- ✅ 50.000 usuários ativos/mês
- ✅ **Mais que suficiente para seu caso!**

---

## 🔒 SEGURANÇA

### ✅ Já Implementado

- ✅ JWT para autenticação
- ✅ Senhas criptografadas (bcrypt)
- ✅ CORS configurado
- ✅ Variáveis de ambiente seguras
- ✅ .env não commitado no Git

### 📝 Recomendações Adicionais

1. **Alterar JWT_SECRET em produção**
   ```powershell
   # Gerar novo secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **HTTPS automático** (Railway já fornece!)

3. **Rate Limiting** (adicionar futuramente se necessário)

---

## 📞 SUPORTE

### Railway
- 📚 Docs: https://docs.railway.app
- 💬 Discord: https://discord.gg/railway
- 🐛 GitHub: https://github.com/railwayapp/railway

### Supabase
- 📚 Docs: https://supabase.com/docs
- 💬 Discord: https://discord.supabase.com
- 🐛 GitHub: https://github.com/supabase/supabase

---

<div align="center">

**🎉 BOA SORTE COM O DEPLOY! 🚀**

Qualquer dúvida, estou aqui para ajudar!

</div>
