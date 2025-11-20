# 🗂️ AÇÃO NECESSÁRIA: Adicionar Ordenação ao Banco

## ⚠️ Execute no Supabase SQL Editor

Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql/new

Cole e execute o SQL abaixo:

```sql
-- ==================== ADICIONAR CAMPOS DE ORDENAÇÃO ====================

-- 1. Adicionar coluna display_order em projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. Adicionar coluna display_order em tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_order 
ON projects(organization_id, display_order);

CREATE INDEX IF NOT EXISTS idx_tasks_order 
ON tasks(project_id, status, display_order);

-- 4. Atualizar projetos existentes com ordem baseada em created_at
UPDATE projects 
SET display_order = subquery.rn
FROM (
  SELECT 
    id, 
    ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at) - 1 AS rn
  FROM projects
) AS subquery
WHERE projects.id = subquery.id;

-- 5. Atualizar tarefas existentes com ordem baseada em created_at
UPDATE tasks 
SET display_order = subquery.rn
FROM (
  SELECT 
    id, 
    ROW_NUMBER() OVER (PARTITION BY project_id, status ORDER BY created_at) - 1 AS rn
  FROM tasks
) AS subquery
WHERE tasks.id = subquery.id;

-- 6. Verificar se funcionou
SELECT COUNT(*), AVG(display_order), MAX(display_order) 
FROM projects 
WHERE display_order IS NOT NULL;

SELECT COUNT(*), AVG(display_order), MAX(display_order) 
FROM tasks 
WHERE display_order IS NOT NULL;
```

## ✅ Resultado Esperado

Você deve ver algo como:

```
count | avg | max
------+-----+----
  43  |  21 | 42

count | avg  | max
------+------+----
 141  | 70.5 | 140
```

## 🔄 Após executar

1. Volte ao VS Code
2. Execute: `node scripts/setup-order.js`
3. Deve mostrar sucesso sem erros
4. Continue com a implementação do drag & drop

## 📝 Notas

- `display_order` é baseado em zero (0, 1, 2, 3...)
- Projetos ordenados por `created_at` dentro da organização
- Tarefas ordenadas por `created_at` dentro do projeto+status
