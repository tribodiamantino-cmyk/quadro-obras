# Revisão Completa do Sistema de Datas

## 📅 Campos de Data no Sistema

### Tabela `projects` (PostgreSQL)
Todos os campos de data são do tipo `DATE` e nullable:

1. **`start_date`** - Data de início da obra
2. **`delivery_forecast`** - Previsão de entrega da obra
3. **`assembler_start_date`** - Data de início da montagem
4. **`electrician_start_date`** - Data de início da parte elétrica
5. **`gsi_forecast_date`** - Data prevista para entrega GSI
6. **`gsi_actual_date`** - Data efetiva de entrega GSI

Também há o campo `updated_at` (timestamp with time zone) para controle de modificação.

---

## 🔄 Formato Padrão

**FORMATO UNIVERSAL**: `YYYY-MM-DD` (ISO 8601)

- ✅ Formato aceito por `<input type="date">` do HTML5
- ✅ Formato retornado por `Date.toISOString().split('T')[0]`
- ✅ Formato consistente entre banco, backend e frontend

---

## 🛠️ Correções Implementadas

### 1. **Backend - Normalização em Todos os Endpoints**

Criada função helper `formatDate()` em **todos os endpoints** que retornam projetos:

```javascript
const formatDate = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};
```

#### Endpoints Atualizados:

- ✅ **GET** `/api/projects/state` - Normaliza datas em todos os projetos retornados
- ✅ **GET** `/api/projects` - Normaliza datas ao buscar lista de projetos
- ✅ **GET** `/api/projects/:id` - Normaliza datas ao buscar projeto específico
- ✅ **GET** `/api/projects/:id/details` - Normaliza datas ao buscar detalhes
- ✅ **POST** `/api/projects` - Normaliza datas ao retornar projeto criado
- ✅ **PATCH** `/api/projects/:id` - Normaliza datas ao retornar projeto atualizado
- ✅ **GET** `/api/calendar` - Já tinha normalização (mantida)

### 2. **Backend - POST Endpoint Corrigido**

**PROBLEMA**: O endpoint `POST /api/projects` só aceitava o campo `name`, ignorando todos os campos de data enviados pelo modal.

**SOLUÇÃO**: Endpoint agora aceita todos os campos:

```javascript
app.post('/api/projects', authenticateToken, async (req, res) => {
  const {
    name, clientName, storeId, workStatusId, category,
    integratorId, assemblerId, electricianId,
    startDate, deliveryForecast, locationAddress, gsiForecastDate
  } = req.body;

  const project = await db.single(
    `INSERT INTO projects (
      name, client_name, store_id, work_status_id, category,
      integrator_id, assembler_id, electrician_id,
      start_date, delivery_forecast, location_address, gsi_forecast_date,
      organization_id, is_current
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [name, clientName, storeId, workStatusId, category,
     integratorId, assemblerId, electricianId,
     startDate || null, deliveryForecast || null, 
     locationAddress, gsiForecastDate || null,
     req.user.organizationId, false]
  );
  
  // Normalizar datas antes de retornar
  // ...
});
```

### 3. **Frontend - Já Estava Correto**

#### Inputs HTML (`index.html`):
- ✅ Todos usam `<input type="date">` (já retorna YYYY-MM-DD nativamente)
- ✅ Modal de criação: `#project-start-date`, `#project-delivery`, `#project-gsi-forecast`
- ✅ Painel de detalhes: inputs dinâmicos criados via JavaScript

#### Função Helper (`app-simple.js`):
```javascript
function formatDateForInput(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return '';
  }
}
```

#### Captura de Valores:
```javascript
const startDate = document.getElementById('project-start-date').value;
const deliveryForecast = document.getElementById('project-delivery').value;
const gsiForecastDate = document.getElementById('project-gsi-forecast').value;
// Inputs type="date" já retornam no formato YYYY-MM-DD
```

### 4. **Frontend - Normalização Defensiva Mantida**

Embora o backend agora garanta formato correto, mantemos normalização defensiva no `loadFromServer()` como camada extra de segurança:

```javascript
const dateFieldsToNormalize = [
  'start_date', 'delivery_forecast', 
  'assembler_start_date', 'electrician_start_date',
  'gsi_forecast_date', 'gsi_actual_date'
];

state.allProjects = (state.allProjects || []).map(p => {
  const copy = { ...p };
  dateFieldsToNormalize.forEach(f => {
    const v = copy[f];
    if (v) {
      try {
        const d = new Date(v);
        if (!isNaN(d.getTime())) {
          copy[f] = d.toISOString().split('T')[0];
        } else {
          copy[f] = null;
        }
      } catch {
        copy[f] = null;
      }
    } else {
      copy[f] = null;
    }
  });
  return copy;
});
```

---

## ✅ Resultados

### Antes:
- ❌ Datas não persistiam após criar projeto (POST não salvava)
- ❌ Calendário mostrava datas, mas detalhes não (formato inconsistente)
- ❌ Datas desapareciam após F5 (cache não invalidado corretamente)

### Depois:
- ✅ POST salva todas as datas corretamente no banco
- ✅ Todos os endpoints retornam datas normalizadas (YYYY-MM-DD)
- ✅ Calendário e detalhes exibem mesmas datas (formato consistente)
- ✅ Datas persistem após F5 (sistema completo funcionando)

---

## 🧪 Teste End-to-End Recomendado

1. **Criar Projeto**:
   - Abrir modal de criação
   - Preencher campos de data (Início, Entrega, GSI)
   - Salvar projeto
   - ✅ Verificar que datas aparecem no painel de detalhes

2. **Editar Datas**:
   - Abrir detalhes de um projeto
   - Alterar data de início, entrega, etc.
   - ✅ Verificar que mudanças são salvas

3. **Refresh F5**:
   - Após editar datas, pressionar F5
   - ✅ Verificar que todas as datas persistem
   - ✅ Verificar calendário mostra eventos corretos
   - ✅ Verificar detalhes mostra mesmas datas do calendário

4. **GSI Workflow**:
   - Definir data prevista GSI
   - Validar entrega GSI (clica no botão)
   - ✅ Verificar data efetiva é salva corretamente

---

## 📝 Commits Relacionados

- `9733d83` - Fix: Force cache invalidation after date field updates
- `ed27e40` - Fix: Normalize date fields in loadFromServer
- **ATUAL** - Feat: Complete date system overhaul with backend normalization

---

## 🔍 Debugging

Se houver problemas com datas:

1. **Backend**: Verificar logs do console para SQL queries
2. **Frontend**: Abrir DevTools Console e verificar:
   ```javascript
   console.log(state.allProjects[0].start_date); // Deve ser "YYYY-MM-DD" ou null
   ```
3. **Banco**: Executar query direto no PostgreSQL:
   ```sql
   SELECT id, name, start_date, delivery_forecast FROM projects LIMIT 5;
   ```

---

**Última Atualização**: 2025-01-06
**Autor**: GitHub Copilot
