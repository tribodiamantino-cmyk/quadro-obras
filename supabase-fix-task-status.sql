-- Corrigir constraint de status das tarefas
-- A constraint original só aceita ('backlog', 'doing', 'done')
-- Precisamos aceitar os status brasileiros

-- Primeiro remove a constraint antiga
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Adiciona a nova constraint com os status corretos
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('Criado', 'Em separação', 'Pendencia', 'Em romaneio', 'Entregue', 'backlog', 'doing', 'done'));

-- Comentário explicativo
COMMENT ON COLUMN tasks.status IS 'Status da tarefa: Criado, Em separação, Pendencia, Em romaneio, Entregue';
