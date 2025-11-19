-- ==================== CRIAR TABELAS ====================

-- Tabela de Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MEMBER', 'VIEWER')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  details_checklist JSONB DEFAULT '[]'::jsonb,
  details_text TEXT DEFAULT '',
  is_current BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('backlog', 'doing', 'done')),
  dates JSONB DEFAULT '{}'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  has_pending BOOLEAN DEFAULT false,
  parent_id TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_current ON projects(is_current);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ==================== DADOS DE EXEMPLO ====================

-- Inserir organização de exemplo
INSERT INTO organizations (name, slug) 
VALUES ('Construtora Exemplo', 'construtora-exemplo')
ON CONFLICT (slug) DO NOTHING
RETURNING id;

-- Pegar o ID da organização (você vai precisar disso para os próximos inserts)
-- Execute esta query separadamente e copie o ID que aparecer:
SELECT id FROM organizations WHERE slug = 'construtora-exemplo';

-- IMPORTANTE: Substitua 'SEU_ORG_ID_AQUI' pelo ID que você copiou acima
-- e execute os comandos abaixo:

-- Inserir usuário admin (senha: admin123 - hash bcrypt)
INSERT INTO users (email, password, name, role, organization_id)
VALUES (
  'admin@construtora.com',
  '$2a$10$rK3QqX8qX5qX5qX5qX5qXOqX5qX5qX5qX5qX5qX5qX5qX5qX5qX5q',
  'Administrador',
  'ADMIN',
  'SEU_ORG_ID_AQUI'
)
ON CONFLICT (email) DO NOTHING;

-- Inserir projeto de exemplo
INSERT INTO projects (name, is_current, organization_id)
VALUES (
  'Projeto Exemplo',
  true,
  'SEU_ORG_ID_AQUI'
)
ON CONFLICT DO NOTHING;
