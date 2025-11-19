-- ==================== NOVAS TABELAS PARA OBRA ====================

-- Tabela de Integradoras
CREATE TABLE IF NOT EXISTS integrators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Montadores
CREATE TABLE IF NOT EXISTS assemblers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Eletricistas
CREATE TABLE IF NOT EXISTS electricians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar novos campos na tabela projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS integrator_id UUID REFERENCES integrators(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assembler_id UUID REFERENCES assemblers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS electrician_id UUID REFERENCES electricians(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS delivery_forecast DATE,
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_integrators_org ON integrators(organization_id);
CREATE INDEX IF NOT EXISTS idx_assemblers_org ON assemblers(organization_id);
CREATE INDEX IF NOT EXISTS idx_electricians_org ON electricians(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_integrator ON projects(integrator_id);
CREATE INDEX IF NOT EXISTS idx_projects_assembler ON projects(assembler_id);
CREATE INDEX IF NOT EXISTS idx_projects_electrician ON projects(electrician_id);

-- Dados de exemplo
DO $$
DECLARE
  org_id UUID;
BEGIN
  SELECT id INTO org_id FROM organizations LIMIT 1;
  
  IF org_id IS NOT NULL THEN
    -- Integradoras de exemplo
    INSERT INTO integrators (name, organization_id) VALUES
    ('Integradora Alpha', org_id),
    ('Integradora Beta', org_id),
    ('Integradora Gamma', org_id)
    ON CONFLICT (name) DO NOTHING;
    
    -- Montadores de exemplo
    INSERT INTO assemblers (name, organization_id) VALUES
    ('Montador João', org_id),
    ('Montador Maria', org_id),
    ('Montador Pedro', org_id)
    ON CONFLICT (name) DO NOTHING;
    
    -- Eletricistas de exemplo
    INSERT INTO electricians (name, organization_id) VALUES
    ('Eletricista Carlos', org_id),
    ('Eletricista Ana', org_id),
    ('Eletricista Roberto', org_id)
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;
