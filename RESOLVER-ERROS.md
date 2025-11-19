# ⚡ RESOLVER ERROS - EXECUÇÃO RÁPIDA

## 🔴 ERRO: "Could not find the table 'public.assemblers'"

### Solução: Executar a Migração SQL

1. **Acesse o Supabase SQL Editor:**
   - Link direto: https://supabase.com/dashboard/project/ucwmumerebazffsgfusp/sql/new

2. **Cole TODO o conteúdo do arquivo `supabase-new-fields.sql`**

3. **Clique em RUN** (ou Ctrl + Enter)

4. **Aguarde a mensagem de sucesso** ✅

---

## 🔴 PROBLEMA: Dropdowns vazios no modal

### Solução: Código já corrigido!

Corrigi 2 problemas:

1. ✅ **`openProjectModal()`** agora é `window.openProjectModal()` (função global)
2. ✅ **`openIntegratorModal()`**, **`openAssemblerModal()`**, **`openElectricianModal()`** também são globais

---

## 🚀 Passos para Testar Agora

### 1️⃣ Execute o SQL no Supabase (link acima)

### 2️⃣ Reinicie o servidor:

```powershell
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
node server-supabase.js
```

### 3️⃣ Acesse as Configurações:

http://localhost:4000/settings.html

### 4️⃣ Crie as entidades nas abas:

- **🏢 Integradoras**: Adicione "Integradora Alpha", "Integradora Beta"
- **🔧 Montadores**: Adicione "João Silva", "Maria Santos"
- **⚡ Eletricistas**: Adicione "Carlos Elétrica", "Ana Instalações"

### 5️⃣ Volte para a página principal:

http://localhost:4000

### 6️⃣ Clique em **+ Nova Obra**

Agora os dropdowns devem estar **preenchidos** com as opções! ✅

---

## 📊 Verificação

Ao abrir o modal:
- ✅ Dropdown de **Loja** deve ter suas lojas
- ✅ Dropdown de **Status** deve ter seus status
- ✅ Dropdown de **Integradora** deve ter as integradoras criadas
- ✅ Dropdown de **Montador** deve ter os montadores criados
- ✅ Dropdown de **Eletricista** deve ter os eletricistas criados

---

## 🐛 Debug

Se ainda não aparecer, pressione **F12** no navegador e veja o console.

Deve mostrar: `State ao abrir modal: { ... }` com todos os arrays preenchidos.

---

## ✅ Tudo Pronto!

Depois que executar o SQL, o erro vai sumir e os dropdowns vão funcionar! 🎉
