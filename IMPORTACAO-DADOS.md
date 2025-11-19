# 📦 GUIA DE IMPORTAÇÃO DE DADOS ANTIGOS

## 🎯 Objetivo

Importar dados do sistema antigo (`quadro-obras`) para o novo sistema (`quadro-obras-testes`) com Supabase.

---

## 📊 Dados Disponíveis

✅ **Arquivo copiado**: `dados-antigos.json`

**Conteúdo:**
- 📁 **41 Projetos**
- 📋 **140 Tarefas**
- 📜 **Histórico completo** de mudanças de status

---

## 🔧 Preparação

### 1. Verificar Ambiente

```powershell
# Certifique-se de que o .env está configurado
cat .env
```

Deve ter:
```env
SUPABASE_URL=sua_url_aqui
SUPABASE_KEY=sua_key_aqui
```

### 2. Criar Usuário Admin (se não existir)

Acesse: http://localhost:4000/register.html

Crie um usuário com email de admin para ser proprietário dos projetos importados.

---

## ⚡ Executar Importação

### Comando Único

```powershell
npm run import
```

Isso vai:
1. ✅ Ler `dados-antigos.json`
2. ✅ Verificar projetos existentes
3. ✅ Importar novos projetos
4. ✅ Importar todas as tarefas
5. ✅ Importar histórico de status
6. ✅ Gerar log de importação

---

## 📋 O Que Acontece Durante a Importação

### 1. Leitura dos Dados

```
📂 Lendo arquivo: c:\quadro-obras-testes\dados-antigos.json

📊 Dados encontrados:
   • Projetos: 41
   • Tarefas: 140
```

### 2. Processamento

Para cada projeto:
- ✅ Verifica se já existe (pelo nome)
- ✅ Se existir → Usa o existente
- ✅ Se não existir → Cria novo

Para cada tarefa:
- ✅ Verifica se já existe (por projeto + título)
- ✅ Se existir → Pula
- ✅ Se não existir → Importa
- ✅ Converte status antigo → novo formato
- ✅ Importa histórico completo

### 3. Mapeamento de Status

| Status Antigo | Status Novo |
|---------------|-------------|
| Criado | created |
| Para separação | pending |
| Em separação | in_separation |
| Pendencia | pending |
| Em romaneio | in_packing |
| Entregue | delivered |
| Concluído | delivered |
| Cancelado | cancelled |

---

## 📊 Resultado Esperado

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        ✅ IMPORTAÇÃO CONCLUÍDA!                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

📊 ESTATÍSTICAS:

   Projetos:
      • Importados: 41
      • Já existiam: 0
      • Total processado: 41

   Tarefas:
      • Importadas: 140
      • Já existiam: 0
      • Total processado: 140

   ✅ Nenhum erro!

💾 Log salvo em: backup/import-log-2025-11-19T...json
```

---

## 🔍 Verificar Importação

### 1. Ver Logs

```powershell
npm run logs
```

### 2. Acessar Sistema

```
http://localhost:4000
```

Faça login e verifique:
- ✅ Projetos aparecem na lista
- ✅ Tarefas estão corretas
- ✅ Status estão mapeados
- ✅ Histórico foi importado

### 3. Verificar Banco Supabase

Acesse: https://supabase.com/dashboard

Navegue até:
- **Table Editor** → `projects` → Deve ter 41 registros
- **Table Editor** → `tasks` → Deve ter 140 registros
- **Table Editor** → `audit_logs` → Histórico importado

---

## ⚠️ Problemas Comuns

### Erro: "Nenhum usuário admin encontrado"

**Causa**: Não existe usuário cadastrado

**Solução**:
```powershell
# 1. Acesse http://localhost:4000/register.html
# 2. Crie um usuário
# 3. Execute novamente: npm run import
```

### Projetos/Tarefas Já Existem

**Causa**: Importação já foi executada antes

**Comportamento**: Script pula duplicados automaticamente

**Solução**: Normal! Veja estatística "Já existiam"

### Erro de Conexão

**Causa**: Supabase URL/Key incorretos

**Solução**:
```powershell
# Verifique .env
cat .env

# Copie do .env.example se necessário
copy .env.example .env
notepad .env
```

---

## 🔄 Re-importar (Se Necessário)

### Opção 1: Limpar Tudo e Importar Novamente

```sql
-- No Supabase SQL Editor:
DELETE FROM audit_logs;
DELETE FROM tasks;
DELETE FROM projects;

-- Depois:
npm run import
```

### Opção 2: Importar Apenas Novos

O script já faz isso automaticamente! Ele:
- ✅ Verifica se projeto existe
- ✅ Verifica se tarefa existe
- ✅ Pula duplicados

---

## 💾 Backup Antes de Importar

### IMPORTANTE: Sempre faça backup!

```powershell
# 1. Backup do banco atual
npm run backup

# 2. Importar dados
npm run import

# 3. Se algo der errado, você tem o backup!
```

---

## 📝 Log de Importação

Cada importação gera um log em:

```
backup/import-log-2025-11-19T14-30-00.000Z.json
```

Contém:
- ✅ Projetos importados/pulados
- ✅ Tarefas importadas/puladas
- ✅ Lista completa de erros (se houver)

---

## 🎯 Checklist de Importação

### Antes

- [ ] `.env` configurado com Supabase
- [ ] Usuário admin criado
- [ ] Backup feito (`npm run backup`)
- [ ] `dados-antigos.json` existe

### Durante

- [ ] Executar `npm run import`
- [ ] Acompanhar progresso no terminal
- [ ] Verificar se há erros

### Depois

- [ ] Verificar estatísticas
- [ ] Acessar http://localhost:4000
- [ ] Confirmar projetos e tarefas
- [ ] Verificar log salvo em `backup/`

---

## 🚀 Próximo Passo: Deploy Railway

Após confirmar que a importação está **100% OK**:

1. ✅ Dados importados localmente
2. ✅ Tudo validado e funcionando
3. 🚀 **Próximo**: Deploy para Railway
4. 🔄 **Depois**: Importar dados no Supabase de produção

**Veja**: `DEPLOY-RAILWAY.md` (próximo guia)

---

## 💡 Dicas

### 1. Importação é Idempotente

Pode executar `npm run import` várias vezes:
- ✅ Não duplica dados
- ✅ Pula o que já existe
- ✅ Importa apenas novos

### 2. Status Automático

O script converte automaticamente:
- "Em separação" → `in_separation`
- "Para separação" → `pending`
- etc.

### 3. Histórico Preservado

Todo o histórico de mudanças de status é importado para `audit_logs`!

### 4. Datas Convertidas

Datas no formato BR (24/09/2025 14:39) são convertidas para ISO 8601.

---

## 📞 Troubleshooting

### Ver Detalhes do Erro

Se houver erros, eles aparecem no log:

```json
{
  "errors": [
    {
      "type": "task",
      "project": "Nome do Projeto",
      "task": "Título da Tarefa",
      "error": "Mensagem de erro detalhada"
    }
  ]
}
```

### Executar Passo a Passo

Se quiser ver cada operação:

```powershell
# Edite scripts/import-old-data.js
# Adicione mais console.log() onde precisar
# Execute: npm run import
```

---

<div align="center">

**✅ IMPORTAÇÃO PRONTA!**

Execute: `npm run import`

E veja a mágica acontecer! ✨

</div>
