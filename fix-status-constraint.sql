-- 1. REMOVER constraint antiga de status
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- 2. ATUALIZAR status das tarefas antigas para novos
UPDATE tasks SET status = 'Criado' WHERE status = 'backlog';
UPDATE tasks SET status = 'Em separação' WHERE status = 'doing';
UPDATE tasks SET status = 'Entregue' WHERE status = 'done';

-- 3. ADICIONAR nova constraint com status corretos
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('Criado', 'Em separação', 'Pendencia', 'Em romaneio', 'Entregue'));

-- Verificar resultado
SELECT status, COUNT(*) as total 
FROM tasks 
GROUP BY status 
ORDER BY status;
