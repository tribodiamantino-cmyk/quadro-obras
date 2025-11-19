-- Adicionar coluna de categoria às obras
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna category
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'nova';

-- Adicionar constraint para valores válidos
ALTER TABLE projects 
ADD CONSTRAINT check_category 
CHECK (category IN ('nova', 'reforma'));

-- Criar índice para melhor performance nos filtros
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);

-- Comentário explicativo
COMMENT ON COLUMN projects.category IS 'Categoria da obra: nova ou reforma';
