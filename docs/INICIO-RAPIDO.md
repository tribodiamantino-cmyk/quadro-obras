# 🎯 INÍCIO RÁPIDO - Quadro de Obras

Guia de 5 minutos para começar a usar o sistema.

---

## 🚀 Para Desenvolvedores

### 1. Clonar e Instalar

```bash
git clone https://github.com/tribodiamantino-cmyk/quadro-obras.git
cd quadro-obras
npm install
```

### 2. Configurar Banco

Crie um PostgreSQL (Railway, Supabase, local) e configure:

```bash
cp .env.example .env
# Edite .env com suas credenciais
```

### 3. Executar

```bash
npm run dev:railway
```

Acesse: **http://localhost:3000**

---

## 👤 Para Usuários

### Acessar Sistema em Produção

**URL:** https://controle-obras.up.railway.app/

**Login padrão:**
- Email: `admin@admin.com`
- Senha: `admin123`

### Criar Primeira Obra

1. Clique em **"+ Nova Obra"**
2. Preencha: Nome, Cliente, Loja
3. Clique em **"Criar Obra"**

### Criar Primeira Tarefa

1. Selecione uma obra na lista
2. Digite o título no campo **"Nova tarefa..."**
3. Pressione **Enter**
4. A tarefa aparece na coluna **"Criado"**

### Mover Tarefa (Kanban)

**Opção 1 - Drag & Drop:**
- Arraste a tarefa entre colunas

**Opção 2 - Botões:**
- Use **◀** para voltar status
- Use **▶** para avançar status

---

## 📖 Documentação Completa

| Documento | Conteúdo |
|-----------|----------|
| **[README.md](../README.md)** | Visão geral, instalação, funcionalidades |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Arquitetura técnica, banco, API, fluxos |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Deploy Railway, Docker, troubleshooting |
| **[CHANGELOG.md](../CHANGELOG.md)** | Histórico de versões |

---

## 🆘 Ajuda Rápida

**Tarefas não aparecem após F5?**
→ Isso foi corrigido na v2.0! Atualize o sistema.

**Como adicionar usuários?**
→ Vá em **Configurações** → **Usuários** → **"+ Novo Usuário"**

**Como arquivar projeto?**
→ Selecione o projeto → **Ações** → **"Arquivar"**

**Como fazer backup?**
→ Execute: `npm run backup`

---

## 📞 Suporte

- **Issues:** https://github.com/tribodiamantino-cmyk/quadro-obras/issues
- **Deploy:** Consulte [DEPLOYMENT.md](DEPLOYMENT.md)
- **API:** Consulte [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Versão:** 2.0.0
