-- Adicionar campo responsible para tasks
-- Este campo armazena o nome da pessoa responsável pela separação do material

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS responsible TEXT DEFAULT NULL;

-- Comentário
COMMENT ON COLUMN tasks.responsible IS 'Nome da pessoa responsável pela separação do material da tarefa';
