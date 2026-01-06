-- Migration: Adicionar histórico de atividades aos projetos

-- 1. Criar tabela de histórico de atividades
CREATE TABLE IF NOT EXISTS project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL, -- 'created', 'moved', 'title_changed', 'status_changed', 'archived', 'restored'
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB, -- Para armazenar dados adicionais (ex: coluna origem/destino)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- 2. Criar índices para performance
CREATE INDEX idx_project_activities_project_id ON project_activities(project_id);
CREATE INDEX idx_project_activities_created_at ON project_activities(created_at DESC);
CREATE INDEX idx_project_activities_organization_id ON project_activities(organization_id);

-- 3. Adicionar campo de notas/detalhes aos projetos
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]'::jsonb;

-- 4. Comentários nas tabelas
COMMENT ON TABLE project_activities IS 'Histórico de atividades e movimentações dos projetos';
COMMENT ON COLUMN project_activities.activity_type IS 'Tipo de atividade: created, moved, title_changed, status_changed, archived, restored';
COMMENT ON COLUMN project_activities.metadata IS 'Dados adicionais em JSON, ex: {"from_status": "Em Andamento", "to_status": "Concluído"}';
COMMENT ON COLUMN projects.notes IS 'Campo de texto livre para notas e detalhes do projeto';
COMMENT ON COLUMN projects.activity_log IS 'Log de atividades em formato JSON (backup/cache)';
