-- ==================== SCHEMA COMPLETO PARA RAILWAY POSTGRESQL ====================
-- Execute este arquivo no banco PostgreSQL do Railway

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== TABELAS PRINCIPAIS ====================

-- Tabela de Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MEMBER', 'VIEWER')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Integradoras
CREATE TABLE IF NOT EXISTS integrators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, organization_id)
);

-- Tabela de Montadores
CREATE TABLE IF NOT EXISTS assemblers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, organization_id)
);

-- Tabela de Eletricistas
CREATE TABLE IF NOT EXISTS electricians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, organization_id)
);

-- Tabela de Projects (obras)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  details_checklist JSONB DEFAULT '[]'::jsonb,
  details_text TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  is_current BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  category VARCHAR(20) DEFAULT 'nova' CHECK (category IN ('nova', 'reforma')),
  client_name TEXT,
  integrator_id UUID REFERENCES integrators(id) ON DELETE SET NULL,
  assembler_id UUID REFERENCES assemblers(id) ON DELETE SET NULL,
  electrician_id UUID REFERENCES electricians(id) ON DELETE SET NULL,
  start_date DATE,
  delivery_forecast DATE,
  gsi_forecast_date DATE,
  gsi_actual_date DATE,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
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

-- ==================== ÍNDICES ====================

CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_current ON projects(is_current);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_integrator ON projects(integrator_id);
CREATE INDEX IF NOT EXISTS idx_projects_assembler ON projects(assembler_id);
CREATE INDEX IF NOT EXISTS idx_projects_electrician ON projects(electrician_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_integrators_org ON integrators(organization_id);
CREATE INDEX IF NOT EXISTS idx_assemblers_org ON assemblers(organization_id);
CREATE INDEX IF NOT EXISTS idx_electricians_org ON electricians(organization_id);

-- ==================== COMENTÁRIOS ====================

COMMENT ON COLUMN projects.gsi_forecast_date IS 'Data prevista para entrega GSI';
COMMENT ON COLUMN projects.gsi_actual_date IS 'Data efetiva da chegada GSI';
COMMENT ON COLUMN projects.archived IS 'Indica se a obra foi arquivada';
COMMENT ON COLUMN projects.category IS 'Categoria da obra: nova ou reforma';

-- ==================== FIM DO SCHEMA ====================
