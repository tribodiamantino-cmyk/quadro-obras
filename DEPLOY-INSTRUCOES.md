# 🚀 INSTRUÇÕES DE DEPLOY - Sistema de Histórico de Atividades

## ⚠️ IMPORTANTE: Execute ANTES de fazer deploy no Railway!

---

## 📋 PASSO 1: Executar Migration no Banco de Dados

### Acesse o Railway Dashboard:
1. Vá para: https://railway.app/
2. Selecione seu projeto: **quadro-obras**
3. Clique no serviço: **PostgreSQL**
4. Clique na aba: **Query**

### Execute a Migration:
1. Abra o arquivo: `migration-add-project-activities.sql`
2. **Copie TODO o conteúdo do arquivo**
3. Cole na aba Query do Railway
4. Clique em **Run Query** ou pressione `Ctrl+Enter`

### Verifique se funcionou:
Execute esta query para confirmar:
```sql
-- Deve retornar a estrutura da nova tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'project_activities';

-- Deve retornar as novas colunas
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('notes', 'activity_log');
```

**Resultado esperado:**
- `project_activities` deve ter: id, project_id, user_id, activity_type, description, old_value, new_value, metadata, created_at, organization_id
- `projects` deve ter agora: notes, activity_log

---

## 🚢 PASSO 2: Deploy no Railway

### Opção A: Deploy Automático (Recomendado)
```bash
git push origin main
```
O Railway detecta automaticamente e faz o deploy.

### Opção B: Deploy Manual via Railway CLI
```bash
railway up
```

---

## ✅ PASSO 3: Testar as Funcionalidades

### 3.1 Testar Modal de Detalhes
1. Acesse o sistema
2. **Duplo-clique em qualquer card de projeto**
3. O modal deve abrir mostrando:
   - ✏️ Título editável (clique para editar)
   - 📝 Campo de notas
   - 📋 Histórico de atividades

### 3.2 Testar Edição de Título
1. No modal, clique no título
2. Edite o texto
3. Pressione Enter ou clique fora
4. Deve aparecer: ✓ Título atualizado com sucesso!
5. O histórico deve mostrar a mudança

### 3.3 Testar Notas
1. Digite algo no campo "Detalhes/Notas"
2. Clique em "Salvar Notas"
3. Deve aparecer: ✓ Notas salvas com sucesso!
4. O histórico deve registrar: 📝 Notas atualizadas

### 3.4 Testar Auto-Logging

#### Criar Nova Obra:
1. Clique em "➕ Nova Obra"
2. Preencha os dados e crie
3. Abra o modal da obra criada
4. Histórico deve mostrar: ✨ [Seu nome] - Obra criada: [nome]

#### Mudar Status:
1. Mude o status de uma obra no dropdown
2. Abra o modal
3. Histórico deve mostrar: 🔄 [Seu nome] - Status alterado de "X" para "Y"

#### Arquivar/Restaurar:
1. Clique no botão arquivar
2. Confirme
3. Abra o modal (filtro "Arquivadas")
4. Histórico deve mostrar: 📦 [Seu nome] - Obra arquivada

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Erro: "relation project_activities does not exist"
**Causa:** Migration não foi executada no banco
**Solução:** Execute o PASSO 1 novamente

### Erro: "column notes does not exist"
**Causa:** Migration foi executada parcialmente
**Solução:** Execute esta query para adicionar as colunas:
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]';
```

### Modal não abre ao duplo-clicar
**Causa:** JavaScript não carregou ou cache do navegador
**Solução:** 
1. Abra DevTools (F12)
2. Vá em Application → Clear Storage → Clear site data
3. Recarregue a página (Ctrl+Shift+R)

### Histórico aparece vazio
**Causa:** Backend não está registrando atividades
**Solução:**
1. Verifique se a migration foi executada
2. Abra DevTools → Network
3. Crie uma nova obra
4. Verifique se há uma chamada POST para `/api/projects/:id/activities`
5. Se retornar 404, o backend não foi deployado corretamente

---

## 📊 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/projects/:id/activities` | Busca histórico de atividades |
| POST | `/api/projects/:id/activities` | Registra nova atividade |
| PATCH | `/api/projects/:id/title` | Atualiza título + registra no histórico |
| PATCH | `/api/projects/:id/notes` | Atualiza notas + registra no histórico |

---

## 🎯 Tipos de Atividades Suportadas

| Tipo | Ícone | Quando é registrado |
|------|-------|---------------------|
| `created` | ✨ | Ao criar nova obra |
| `status_changed` | 🔄 | Ao mudar status no dropdown |
| `title_changed` | ✏️ | Ao editar título no modal |
| `notes_updated` | 📝 | Ao salvar notas |
| `archived` | 📦 | Ao arquivar obra |
| `restored` | ♻️ | Ao restaurar obra arquivada |

---

## 📦 Arquivos Modificados

### Backend:
- `server-railway.js` - 4 novos endpoints (commit d395baf)

### Frontend:
- `public/app-simple.js` - Modal + auto-logging (commit aecb7b6)
- `public/index.html` - Estrutura do modal (commit d395baf)

### Database:
- `migration-add-project-activities.sql` - Nova tabela + campos (commit d395baf)

### Documentação:
- `FEATURE-CARD-DETAILS-HISTORY.md` - Documentação completa (commit d395baf)

---

## ✅ Checklist Final

- [ ] Migration executada no Railway
- [ ] Deploy realizado (git push origin main)
- [ ] Modal abre ao duplo-clicar
- [ ] Título editável funciona
- [ ] Notas salvam corretamente
- [ ] Histórico mostra criação de obra
- [ ] Histórico mostra mudanças de status
- [ ] Histórico mostra arquivamento
- [ ] Ícones e emojis aparecem corretamente
- [ ] Toast de notificação funciona

---

## 🎉 Pronto!

Se todos os itens do checklist estiverem marcados, o sistema está 100% funcional!

**Dúvidas?** Verifique o arquivo `FEATURE-CARD-DETAILS-HISTORY.md` para documentação técnica detalhada.
