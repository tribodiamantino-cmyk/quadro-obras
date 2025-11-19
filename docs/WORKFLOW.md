# 🔄 Workflow de Desenvolvimento

## Fluxo de Trabalho

### 1. Desenvolvimento Local (Porta 3001)

```bash
# Iniciar servidor de desenvolvimento
PORT=3001 npm run dev

# Ou no PowerShell
$env:PORT=3001; npm run dev
```

**Acesso:** http://localhost:3001

### 2. Testar Novas Funcionalidades

- ✅ Implementar mudanças
- ✅ Testar localmente na porta 3001
- ✅ Verificar logs e erros
- ✅ Validar todas as funcionalidades

### 3. Commit e Deploy

```bash
# Após testes bem-sucedidos
git add .
git commit -m "feat: descrição da funcionalidade"
git push origin main
```

**Deploy Automático:** Railway detecta push e faz deploy automaticamente para produção (porta 4000)

### 4. Validação em Produção

- ✅ Acessar https://quadro-obras-production.up.railway.app
- ✅ Testar funcionalidade em produção
- ✅ Verificar logs no Railway

## ⚙️ Configuração Dual-Port

### Desenvolvimento (3001)

```bash
# .env.local
PORT=3001
NODE_ENV=development
SUPABASE_URL=sua_url
SUPABASE_ANON_KEY=sua_key
JWT_SECRET=seu_secret
CORS_ORIGIN=*
```

### Produção (4000)

Configurado no Railway com variáveis de ambiente:
- `PORT=4000`
- `NODE_ENV=production`
- Outras variáveis já configuradas

## 📋 Checklist de Deploy

- [ ] Testar localmente (porta 3001)
- [ ] Commit com mensagem descritiva
- [ ] Push para GitHub
- [ ] Aguardar deploy automático Railway
- [ ] Validar em produção
- [ ] Verificar logs se necessário

## 🏷️ Versionamento

```bash
# Criar nova versão
git tag -a v1.1.0 -m "Descrição da versão"
git push origin main --tags
```

## 🔧 Comandos Úteis

```bash
# Ver logs locais
npm run logs

# Backup banco de dados
npm run backup

# Visualizar status Git
git status

# Ver tags
git tag -l
```

## 📦 Estrutura de Branches

- `main` - Produção (protegida)
- `staging` - Homologação (futuro)
- `development` - Desenvolvimento (futuro)

**Nota:** Atualmente trabalhando direto na `main`. Considere usar branches para projetos maiores.
