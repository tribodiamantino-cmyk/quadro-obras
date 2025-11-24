# 🔧 Correção: Erro ao Mover Tarefas (v1.1.1)

**Data:** 24/11/2025  
**Problema:** "Cannot coerce the result to a single JSON object" + "Erro de conexão"

---

## 🐛 Problema Identificado

### 1. **140 tarefas sem `organization_id`**
Durante a importação inicial dos dados, as tarefas foram criadas **SEM** o campo `organization_id`.

**Consequência:**
- Endpoint `PATCH /api/tasks/:id` filtrava por `organization_id`
- Como as tarefas não tinham esse campo, o filtro não retornava nada
- Ao usar `.single()` em resultado vazio/múltiplo, dava erro JSON

### 2. **Tratamento de erro inadequado**
- Frontend não verificava `res.ok` antes de processar resposta
- Logs insuficientes para debug
- Mensagens de erro genéricas para o usuário

---

## ✅ Solução Aplicada

### 1. **Script de Correção: `fix-tasks-organization.js`**

```javascript
// Para cada tarefa sem organization_id:
// 1. Buscar projeto da tarefa
// 2. Copiar organization_id do projeto
// 3. Atualizar tarefa
```

**Resultado:**
- ✅ **140 tarefas** corrigidas
- ✅ **0 erros**
- ✅ Todas as tarefas agora têm `organization_id`

### 2. **Melhorias no Backend** (`server-supabase.js`)

#### Endpoint: `PATCH /api/tasks/:id`
```javascript
// ANTES
const { data: task, error } = await supabase
  .from('tasks')
  .update(updates)
  .eq('id', id)
  .eq('organization_id', req.user.organizationId)
  .select()
  .single();

if (error) throw error;

// DEPOIS
console.log(`📝 Atualizando tarefa ${id}:`, updates);

const { data: task, error } = await supabase
  .from('tasks')
  .update(updates)
  .eq('id', id)
  .eq('organization_id', req.user.organizationId)
  .select()
  .single();

if (error) {
  console.error(`❌ Erro ao atualizar tarefa ${id}:`, error);
  throw error;
}

if (!task) {
  console.error(`❌ Tarefa ${id} não encontrada`);
  return res.status(404).json({ message: 'Tarefa não encontrada' });
}

console.log(`✅ Tarefa ${id} atualizada com sucesso`);
```

#### Endpoint: `POST /api/tasks/reorder`
```javascript
// ANTES
await Promise.all(updates);
res.json({ message: 'Ordem atualizada', count: taskIds.length });

// DEPOIS
const results = await Promise.all(updates);

// Verificar se houve erros
const errors = results.filter(r => r.error);
if (errors.length > 0) {
  console.error('❌ Erros ao reordenar tarefas:', errors);
  return res.status(500).json({ 
    message: 'Erro ao reordenar algumas tarefas',
    errors: errors.map(e => e.error.message)
  });
}

console.log(`✅ ${taskIds.length} tarefas reordenadas com sucesso`);
```

### 3. **Melhorias no Frontend** (`app-simple.js`)

#### Função `saveTasksOrder`
```javascript
// ANTES
try {
  const res = await api('/api/tasks/reorder', {...});
  if (!res.ok) {
    console.error('Erro ao salvar ordem das tarefas');
  }
} catch (error) {
  console.error('Erro ao salvar ordem das tarefas:', error);
}

// DEPOIS
try {
  console.log(`📋 Salvando ordem de ${taskIds.length} tarefas (${status})...`);
  
  const res = await api('/api/tasks/reorder', {...});
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('❌ Erro ao salvar ordem das tarefas:', errorData);
    showToast('Erro ao salvar ordem', 'error');
    return false;
  }
  
  const result = await res.json();
  console.log(`✅ Ordem salva: ${result.count} tarefas`);
  return true;
  
} catch (error) {
  console.error('❌ Erro de conexão ao salvar ordem:', error);
  showToast('Erro de conexão', 'error');
  return false;
}
```

#### Função `optimisticUpdate`
```javascript
// ANTES
const response = await apiCall();

if (!response.ok) {
  rollbackFn();
  const error = await response.json();
  showToast(error.message || 'Erro ao salvar', 'error');
  return false;
}

// DEPOIS
await apiCall(); // apiCall já trata erros internamente

// Se apiCall jogar erro, cai no catch:
catch (error) {
  console.error('❌ Erro no update otimista:', error);
  rollbackFn();
  showToast(error.message || 'Erro de conexão', 'error');
  return false;
}
```

#### Drag & Drop Handler
```javascript
// DEPOIS
const apiCall = async () => {
  try {
    // Se mudou de coluna, atualizar status primeiro
    if (statusChanged) {
      console.log(`📝 Atualizando status: ${oldStatus} → ${newStatus}`);
      
      const res = await api(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Erro ao atualizar status:', errorData);
        throw new Error(errorData.message || 'Erro ao atualizar status');
      }
      
      console.log(`✅ Status atualizado com sucesso`);
    }
    
    // Sempre salvar ordem dentro da coluna
    const orderSaved = await saveTasksOrder(newStatus, col);
    
  } catch (error) {
    console.error('❌ Erro na chamada API:', error);
    throw error; // Re-throw para acionar rollback
  }
};
```

---

## 📊 Scripts de Diagnóstico Criados

### 1. `check-duplicate-tasks.js`
Verifica se há tarefas com ID duplicado ou sem `organization_id`.

```bash
node scripts/check-duplicate-tasks.js
```

### 2. `check-observations.js`
Verifica quais projetos têm/não têm observações.

```bash
node scripts/check-observations.js
```

### 3. `fix-tasks-organization.js`
Corrige `organization_id` de todas as tarefas.

```bash
node scripts/fix-tasks-organization.js
```

### 4. `import-missing-observations.js`
Importa observações faltantes do arquivo `dados-antigos.json`.

```bash
node scripts/import-missing-observations.js
```

---

## 🧪 Como Testar

1. **Abrir sistema:** https://quadro-obras-production.up.railway.app
2. **Selecionar qualquer obra**
3. **Arrastar tarefa** de uma coluna para outra
4. **Verificar:**
   - ✅ Tarefa move suavemente
   - ✅ Não aparece erro "Cannot coerce..."
   - ✅ Não aparece "Erro de conexão"
   - ✅ Toast de sucesso: "✓ Tarefa movida"

5. **Usar botões ◀ ▶** para mover tarefas
6. **Verificar logs no console do navegador:**
   - 📋 Salvando ordem...
   - ✅ Status atualizado com sucesso
   - ✅ Ordem salva

---

## 📝 Logs Úteis

### Frontend (Console do Navegador)
```
📋 Salvando ordem de 5 tarefas (Em separação)...
📝 Atualizando status de "RP 898 DIVISORIAS": Criado → Em separação
✅ Status atualizado com sucesso
✅ Ordem salva: 5 tarefas
```

### Backend (Terminal/Railway)
```
📝 Atualizando tarefa YoWNBDj9: { status: 'Em separação' }
✅ Tarefa YoWNBDj9 atualizada com sucesso
📋 Reordenando 5 tarefas no projeto hhv0KYdJ, status: Em separação
✅ 5 tarefas reordenadas com sucesso
```

---

## 🚀 Deployment

```bash
git add -A
git commit -m "fix: corrigir organization_id das tarefas e melhorar tratamento de erros no drag & drop (v1.1.1)"
git push origin main
```

**Railway** faz deploy automático em ~2 minutos.

---

## ✅ Checklist de Verificação

- [x] Script de correção executado com sucesso
- [x] 140 tarefas atualizadas com `organization_id`
- [x] Backend com logs detalhados
- [x] Frontend com tratamento de erro robusto
- [x] Mensagens de erro amigáveis ao usuário
- [x] Rollback automático em caso de falha
- [x] Código commitado e enviado para produção
- [x] Documentação criada

---

## 📚 Arquivos Modificados

### Backend
- `server-supabase.js` - Melhorias em logs e tratamento de erro

### Frontend
- `public/app-simple.js` - Tratamento de erro robusto no drag & drop

### Scripts
- `scripts/check-duplicate-tasks.js` - NOVO
- `scripts/fix-tasks-organization.js` - NOVO
- `scripts/check-observations.js` - NOVO
- `scripts/import-missing-observations.js` - NOVO

### Documentação
- `CORRECAO-DRAG-DROP.md` - Este arquivo

---

**Versão:** v1.1.1  
**Status:** ✅ Corrigido e em produção  
**Próxima ação:** Monitorar logs para verificar estabilidade
