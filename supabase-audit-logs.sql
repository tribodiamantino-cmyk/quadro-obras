-- ================================================
-- SISTEMA DE AUDITORIA (LOGS)
-- ================================================

-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Ação realizada
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'archive', 'restore'
  
  -- Entidade afetada
  entity_type VARCHAR(50) NOT NULL, -- 'project', 'task', 'store', 'status', 'user', etc.
  entity_id VARCHAR(255), -- ID da entidade (pode ser NULL para ações gerais)
  entity_name TEXT, -- Nome/título da entidade para referência
  
  -- Dados da mudança (JSON)
  old_data JSONB, -- Estado anterior (para updates/deletes)
  new_data JSONB, -- Estado novo (para creates/updates)
  
  -- Metadados
  ip_address INET, -- IP do usuário
  user_agent TEXT, -- Navegador/dispositivo
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para busca rápida
  CONSTRAINT audit_logs_action_check CHECK (action IN ('create', 'update', 'delete', 'archive', 'restore', 'login', 'logout'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Adicionar coluna 'active' na tabela users (para desativar usuários sem excluir)
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Comentários para documentação
COMMENT ON TABLE audit_logs IS 'Registro de todas as ações realizadas no sistema para auditoria';
COMMENT ON COLUMN audit_logs.action IS 'Tipo de ação: create, update, delete, archive, restore, login, logout';
COMMENT ON COLUMN audit_logs.entity_type IS 'Tipo de entidade afetada: project, task, store, status, user, etc';
COMMENT ON COLUMN audit_logs.old_data IS 'Estado anterior da entidade (JSON)';
COMMENT ON COLUMN audit_logs.new_data IS 'Estado novo da entidade (JSON)';

-- Verificar resultado
SELECT 'audit_logs table created successfully!' AS status;
SELECT COUNT(*) as total_logs FROM audit_logs;
