-- ==================== NOVAS TABELAS ====================

-- Tabela de Lojas/Empresas
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  color TEXT DEFAULT '#3498db',
  active BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Status de Obras
CREATE TABLE IF NOT EXISTS work_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  order_position INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas na tabela projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS work_status_id UUID REFERENCES work_statuses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stores_organization ON stores(organization_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(active);
CREATE INDEX IF NOT EXISTS idx_work_statuses_organization ON work_statuses(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_statuses_order ON work_statuses(order_position);
CREATE INDEX IF NOT EXISTS idx_projects_store ON projects(store_id);
CREATE INDEX IF NOT EXISTS idx_projects_work_status ON projects(work_status_id);

-- ==================== DADOS PADRÃO ====================

-- Inserir status padrões para a organização existente
-- IMPORTANTE: Substitua 'SEU_ORG_ID' pelo ID da sua organização
-- Para pegar o ID, execute: SELECT id FROM organizations WHERE slug = 'teste' OR slug = 'minha-construtora';

DO $$
DECLARE
  org_id UUID;
BEGIN
  -- Pegar o primeiro organization_id disponível
  SELECT id INTO org_id FROM organizations LIMIT 1;
  
  IF org_id IS NOT NULL THEN
    -- Inserir status padrões
    INSERT INTO work_statuses (name, color, order_position, organization_id) VALUES
    ('Planejamento', '#3498db', 1, org_id),
    ('Em Execução', '#f39c12', 2, org_id),
    ('Pausado', '#e74c3c', 3, org_id),
    ('Concluído', '#27ae60', 4, org_id),
    ('Cancelado', '#95a5a6', 5, org_id)
    ON CONFLICT DO NOTHING;
    
    -- Inserir lojas de exemplo
    INSERT INTO stores (name, code, color, organization_id) VALUES
    ('Loja Centro', 'CTR', '#3498db', org_id),
    ('Loja Shopping', 'SHP', '#e74c3c', org_id),
    ('Loja Norte', 'NRT', '#27ae60', org_id),
    ('Loja Sul', 'SUL', '#f39c12', org_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
