-- Migração: Adicionar controle de lojas por usuário
-- Permite que cada usuário veja apenas as lojas atribuídas a ele

-- 1. Criar tabela de relacionamento user_stores
CREATE TABLE IF NOT EXISTS user_stores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, store_id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_store_id ON user_stores(store_id);

-- 3. Adicionar campo para indicar se usuário tem acesso a todas as lojas
ALTER TABLE users ADD COLUMN IF NOT EXISTS all_stores_access BOOLEAN DEFAULT false;

-- 4. Comentários
COMMENT ON TABLE user_stores IS 'Relacionamento entre usuários e lojas - define quais lojas cada usuário pode visualizar';
COMMENT ON COLUMN users.all_stores_access IS 'Se true, usuário tem acesso a todas as lojas. Se false, acesso limitado às lojas em user_stores';

-- 5. Popular com dados iniciais (todos os usuários existentes terão acesso a todas as lojas por padrão)
UPDATE users SET all_stores_access = true WHERE all_stores_access IS NULL;

