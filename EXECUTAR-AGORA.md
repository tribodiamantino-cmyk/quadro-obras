# 🚀 EXECUTAR MIGRAÇÃO PARA MODAL DE OBRAS

## 1️⃣ Executar SQL no Supabase

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

## 3️⃣ Testar o Modal

1. Acesse: http://localhost:4000
2. Faça login com: teste@teste.com / senha123
3. Clique no botão **"+ Nova Obra"** na sidebar
4. Preencha os campos:
   - **Cliente**: Nome do cliente
   - **Loja**: Selecione uma loja
   - **Status**: Selecione um status
   - **Integradora**: Digite ou selecione (autocomplete)
   - **Montador**: Digite ou selecione (autocomplete)
   - **Eletricista**: Digite ou selecione (autocomplete)
   - **Data Início**: Opcional
   - **Previsão Entrega**: Opcional
   - **Localização**: Endereço opcional

5. Clique em **Criar Obra**

## ✨ Funcionalidades Auto-Create

Se você digitar um nome que **não existe** nos campos:
- Integradora
- Montador
- Eletricista

O sistema **automaticamente cria** essa nova opção no banco de dados! 🎉

Na próxima vez que abrir o modal, essa opção aparecerá no autocomplete.

## 📋 Verificação

Após criar uma obra:
- A obra deve aparecer na lista da sidebar
- Com a cor do status na borda esquerda
- Com o código da loja no topo
- Ao clicar, deve abrir os detalhes

## 🔧 Próximos Passos (Opcional)

Se quiser gerenciar as Integradoras/Montadores/Eletricistas na página de configurações:
- Precisaremos adicionar abas no **settings.html**
- Similar às abas de Lojas e Status

Por enquanto, eles são criados automaticamente pelo modal! 🚀
