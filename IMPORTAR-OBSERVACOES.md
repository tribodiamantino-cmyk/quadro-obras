# 📝 Importar Observações Faltantes

## Problema Identificado

Durante a importação inicial dos dados antigos, o script **NÃO IMPORTOU**:
- ✅ Observações (campo de texto livre)
- ✅ Checklist de detalhes

Apenas os seguintes campos foram migrados:
- Nome do projeto
- Tarefas (title, status, created_at)
- Histórico de mudanças

## Solução

Script criado: `scripts/import-missing-observations.js`

Este script vai:
1. Ler o arquivo `dados-antigos.json`
2. Para cada projeto, buscar no Supabase pelo nome
3. Atualizar os campos `details_text` e `details_checklist`
4. Gerar log de resultados

## Como Executar

### Passo 1: Verificar Arquivo de Dados Antigos

Certifique-se de que o arquivo `dados-antigos.json` existe na raiz do projeto.

Se não tiver, você pode criar um backup a partir do sistema antigo.

### Passo 2: Executar Script

```powershell
node scripts/import-missing-observations.js
```

### Passo 3: Verificar Resultado

O script vai mostrar:
- ✅ Projetos atualizados (com observações)
- ⏭️ Projetos sem observações (pulados)
- ❌ Projetos não encontrados
- 💾 Log salvo em `backup/observations-import-[timestamp].json`

## Estrutura de Dados

### Campos Antigos (db.json / dados-antigos.json)

```json
{
  "name": "Obra Exemplo",
  "detailsText": "Observações aqui...",
  "detailsChecklist": [
    { "text": "Item 1", "checked": true },
    { "text": "Item 2", "checked": false }
  ]
}
```

OU versão alternativa:

```json
{
  "name": "Obra Exemplo",
  "details": "Observações aqui..." // String
}
```

OU:

```json
{
  "name": "Obra Exemplo",
  "details": [
    { "text": "Item 1", "checked": true }
  ] // Array
}
```

### Campos Novos (Supabase - snake_case)

```sql
details_text       TEXT           -- Observações em texto livre
details_checklist  JSONB          -- Array de { text, checked }
```

## Após a Importação

### Verificar no Frontend

1. Abra uma obra qualquer
2. Role até a seção "Observações"
3. Deve aparecer o texto que estava no sistema antigo

### Verificar no Banco

```sql
SELECT 
  name,
  details_text,
  details_checklist
FROM projects
WHERE details_text IS NOT NULL
   OR details_checklist IS NOT NULL;
```

## Rollback (se necessário)

Se algo der errado, você pode limpar os campos:

```sql
UPDATE projects
SET 
  details_text = NULL,
  details_checklist = NULL;
```

Depois execute o script novamente.

## Troubleshooting

### "Arquivo dados-antigos.json não encontrado"

Crie o arquivo a partir do backup do sistema antigo (db.json).

### "Projeto não encontrado"

O nome do projeto no arquivo antigo é diferente do nome no Supabase.
Verifique com:

```sql
SELECT id, name FROM projects ORDER BY name;
```

### "Nenhuma observação atualizada"

Verifique se o arquivo `dados-antigos.json` realmente contém os campos:
- `detailsText`
- `detailsChecklist`
- `details` (alternativo)

## Compatibilidade

- ✅ PostgreSQL / Supabase
- ✅ Node.js 16+
- ✅ Campos JSONB para checklist

## Próximos Passos

Após importar com sucesso:

1. ✅ Verificar dados no frontend
2. ✅ Testar edição de observações
3. ✅ Confirmar que está salvando corretamente
4. 🗑️ Remover arquivo `dados-antigos.json` (opcional - fazer backup antes)

---

**Data:** 22/11/2025  
**Versão:** 1.1.0  
**Autor:** Sistema de Migração
