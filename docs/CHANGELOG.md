# 📝 Changelog

## [1.0.2] - 2025-11-19

### ✨ Adicionado
- **Display de versão e data de atualização** no canto inferior direito
  - Mostra a versão atual do sistema (ex: v1.0.2)
  - Exibe data e hora da última atualização
  - Posicionamento fixo no canto inferior direito
  - Design discreto com fundo translúcido
  - API endpoint `/api/version` para buscar informações
  - Implementado em todas as páginas (dashboard e configurações)

### 🎨 Melhorias Visuais
- Footer redesenhado com:
  - Posição fixa (não ocupa espaço)
  - Backdrop blur para efeito glassmorphism
  - Cores da paleta do sistema (#3b82f6, #64748b)
  - Responsivo e discreto

---

## [1.0.1] - 2025-11-19

### 🐛 Correções
- **Fix crítico para iOS Safari**: Filtros não funcionavam no iPhone
  - Adicionado evento `input` além de `change` em todos os selects
  - Filtros da sidebar (Loja, Status, Categoria)
  - Dropdown de status nos cards de projeto
  - Todos os campos select no modal de detalhes
  - Compatibilidade total com Safari iOS

### 🔧 Técnico
- Implementado padrão de eventos duplos para compatibilidade cross-browser
- Adicionado `data-attributes` para facilitar manipulação DOM
- Event listeners programáticos com `setTimeout` para garantir renderização

---

## [1.0.0] - 2025-11-19

### 🎉 Lançamento Inicial
- Sistema completo de gestão de obras multi-tenant
- Autenticação JWT com 3 níveis de permissão (ADMIN, MEMBER, VIEWER)
- Sistema Kanban com 5 status
- Gerenciamento de usuários
- Atualização em tempo real via Socket.IO
- 41 projetos e 140 tarefas importados do sistema antigo
- Deploy em produção no Railway
- Documentação completa

### 🚀 Funcionalidades
- Criar, editar e arquivar obras
- Sistema de tarefas com drag-and-drop entre status
- Filtros por loja, status e categoria
- Gerenciamento de lojas, status, integradoras, montadores e eletricistas
- Logs de auditoria completos
- Campos GSI para controle de entregas
- Painel administrativo completo

### 📦 Tecnologias
- Node.js + Express.js
- Supabase (PostgreSQL)
- Socket.IO para real-time
- JWT para autenticação
- Bcrypt para senhas
- Vanilla JavaScript (sem frameworks)

---

## Formato de Versão

Seguimos [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.x.x): Mudanças incompatíveis na API
- **MINOR** (x.1.x): Novas funcionalidades compatíveis
- **PATCH** (x.x.1): Correções de bugs

**Tipo de Commits:**
- `feat:` - Nova funcionalidade (MINOR)
- `fix:` - Correção de bug (PATCH)
- `chore:` - Tarefas de manutenção
- `docs:` - Documentação
- `style:` - Formatação de código
- `refactor:` - Refatoração sem mudanças funcionais
- `perf:` - Melhorias de performance
- `test:` - Testes
