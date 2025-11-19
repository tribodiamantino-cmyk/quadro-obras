# 🚀 EXECUTAR SISTEMA AFINADO

## 1️⃣ Executar SQL no Supabase (se ainda não fez)

1. Acesse: https://supabase.com/dashboard/project/ucwmumerebazffsgfusp/sql/new
2. Cole o conteúdo do arquivo **supabase-new-fields.sql**
3. Clique em **RUN** (ou pressione Ctrl + Enter)
4. Aguarde confirmação de sucesso ✅

## 2️⃣ Reiniciar o Servidor

No PowerShell:

```powershell
# Parar processo do Node (se estiver rodando)
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Iniciar servidor
node server-supabase.js
```

## 3️⃣ Configurar as Entidades

### Primeiro, configure as opções nas Configurações:

1. Acesse: http://localhost:4000/settings.html
2. Faça login com: teste@teste.com / senha123

### Configure cada aba:

#### 🏢 Aba Integradoras
Clique em **+ Nova Integradora** e adicione:
- Integradora Alpha
- Integradora Beta
- Integradora Gamma

#### 🔧 Aba Montadores
Clique em **+ Novo Montador** e adicione:
- João Silva
- Maria Santos
- Pedro Oliveira

#### ⚡ Aba Eletricistas
Clique em **+ Novo Eletricista** e adicione:
- Carlos Elétrica
- Ana Instalações
- Roberto Luz

## 4️⃣ Criar uma Obra

1. Acesse: http://localhost:4000
2. Clique no botão **"+ Nova Obra"** na sidebar
3. Preencha os campos:
   - **Cliente**: Nome do cliente
   - **Loja**: Selecione uma loja (dropdown)
   - **Status**: Selecione um status (dropdown)
   - **Integradora**: Selecione da lista (dropdown) ⭐
   - **Montador**: Selecione da lista (dropdown) ⭐
   - **Eletricista**: Selecione da lista (dropdown) ⭐
   - **Data Início**: Opcional
   - **Previsão Entrega**: Opcional
   - **Localização**: Endereço opcional

4. Clique em **Criar Obra**

## ✨ Mudanças Importantes

### 🔄 Antes vs Agora

**ANTES:**
- ❌ Campos de texto com autocomplete
- ❌ Sistema criava automaticamente ao digitar

**AGORA:**
- ✅ **Dropdowns (select)** normais
- ✅ **Gerenciamento centralizado** nas Configurações
- ✅ **3 novas abas** na página de configurações
- ✅ Apenas ADMIN pode criar/excluir entidades

### 📋 Nova Estrutura

Agora você gerencia tudo nas **Configurações**:
1. 🏪 **Lojas** - Criar, editar, ativar/desativar
2. 📊 **Status de Obras** - Nome, cor, ordem
3. 🏢 **Integradoras** - Criar, excluir ⭐ NOVO
4. 🔧 **Montadores** - Criar, excluir ⭐ NOVO
5. ⚡ **Eletricistas** - Criar, excluir ⭐ NOVO
6. 👥 **Usuários** - Gerenciar permissões

## 📊 Verificação

Após criar uma obra:
- ✅ A obra deve aparecer na lista da sidebar
- ✅ Com a cor do status na borda esquerda
- ✅ Com o código da loja no topo
- ✅ Com o nome do cliente

## 💡 Dicas de Uso

1. **Primeiro configure tudo** nas abas de configurações
2. **Depois crie as obras** selecionando das listas
3. **Para adicionar nova opção**: Vá em Configurações → Aba correspondente → Criar
4. **Apenas ADMIN** pode gerenciar as configurações

## 🎉 Tudo Pronto!

Sistema completo com gerenciamento centralizado! 🚀

Veja mais detalhes em **AFINADO.md**
