-- Adicionar campos de ordenação para projetos e tarefas

-- Adicionar campo display_order para projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Adicionar campo display_order para tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Criar índices para otimizar ordenação
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(organization_id, display_order);
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(project_id, status, display_order);

-- Atualizar projetos existentes com ordem baseada em created_at
UPDATE projects 
SET display_order = subquery.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at) - 1 AS rn
  FROM projects
) AS subquery
WHERE projects.id = subquery.id;

-- Atualizar tarefas existentes com ordem baseada em created_at
UPDATE tasks 
SET display_order = subquery.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id, status ORDER BY created_at) - 1 AS rn
  FROM tasks
) AS subquery
WHERE tasks.id = subquery.id;

-- Comentário
COMMENT ON COLUMN projects.display_order IS 'Ordem de exibição do projeto na sidebar (0-based)';
COMMENT ON COLUMN tasks.display_order IS 'Ordem de exibição da tarefa dentro de sua coluna de status (0-based)';
