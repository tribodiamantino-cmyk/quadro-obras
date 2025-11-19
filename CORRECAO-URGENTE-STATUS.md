# 🔧 CORREÇÃO URGENTE - Status das Tarefas

## Problema
As tarefas estão com status antigos (`backlog`, `doing`, `done`) mas o código busca por novos (`Criado`, `Em separação`, etc). Por isso não aparecem!

## Solução - EXECUTE AGORA no Supabase

### 1️⃣ Acesse o Supabase SQL Editor
1. Abra: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de banco de dados na esquerda)
4. Clique em **+ New query**

### 2️⃣ Cole e Execute este SQL:

```sql
-- PASSO 1: Remover constraint antiga
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- PASSO 2: Atualizar status (backlog -> Criado)
UPDATE tasks SET status = 'Criado' WHERE status = 'backlog';

-- PASSO 3: Atualizar status (doing -> Em separação)  
UPDATE tasks SET status = 'Em separação' WHERE status = 'doing';

-- PASSO 4: Atualizar status (done -> Entregue)
UPDATE tasks SET status = 'Entregue' WHERE status = 'done';

-- PASSO 5: Adicionar nova constraint
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('Criado', 'Em separação', 'Pendencia', 'Em romaneio', 'Entregue'));

-- PASSO 6: Verificar resultado
SELECT status, COUNT(*) as total 
FROM tasks 
GROUP BY status 
ORDER BY status;
```

### 3️⃣ Clique em **RUN** (ou Ctrl+Enter)

### 4️⃣ Veja o resultado
Deve mostrar algo como:
```
status          | total
----------------|------
Criado          | 5
```

### 5️⃣ Recarregue o navegador (F5)

As tarefas devem aparecer! 🎉

---

## Depois da execução

Reinicie o servidor:
```bash
npm start
```

E recarregue a página. As 5 tarefas devem aparecer na coluna correta!
