-- Adicionar campo archived na tabela projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Criar índice para facilitar filtros
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);

-- Por padrão, filtrar apenas obras não arquivadas nas queries
COMMENT ON COLUMN projects.archived IS 'Indica se a obra foi arquivada (soft delete para consultas futuras)';
